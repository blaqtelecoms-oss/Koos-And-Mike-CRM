import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import tls from 'node:tls';

const IMAP_CONFIG = {
  host: "mail.blaqmedia.co.za",
  port: 993,
  username: "leads@blaqmedia.co.za",
  password: Deno.env.get("LEADS_EMAIL_PASSWORD"),
};

async function connectIMAP(sinceDate = null) {
  const socket = tls.connect({
    host: IMAP_CONFIG.host,
    port: IMAP_CONFIG.port,
    checkServerIdentity: () => undefined,
  });

  let dataBuffer = "";
  let waitingResolver = null;
  let waitingTag = null;
  const emails = [];

  // Set up data handler
  socket.on("data", (data) => {
    dataBuffer += data.toString();

    // Check if we're waiting for a tagged response
    if (waitingTag && waitingResolver) {
      const tagRegex = new RegExp(`^${waitingTag} (OK|NO|BAD)`, "m");
      if (tagRegex.test(dataBuffer)) {
        const response = dataBuffer;
        dataBuffer = "";
        const resolver = waitingResolver;
        const tag = waitingTag;
        waitingResolver = null;
        waitingTag = null;
        resolver({ tag, response });
      }
    }
  });

  // Helper: send a command and wait for the tagged response
  function sendCommand(cmd, tag) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (waitingResolver === resolve) {
          waitingResolver = null;
          waitingTag = null;
          reject(new Error(`Timeout waiting for ${tag} response`));
        }
      }, 30000);

      waitingResolver = (result) => {
        clearTimeout(timeout);
        resolve(result);
      };
      waitingTag = tag;
      socket.write(cmd + "\r\n");
    });
  }

  // Wait for connection + greeting
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timeout waiting for greeting")), 15000);

    const originalHandler = socket.listeners("data")[0];
    socket.once("data", () => {
      clearTimeout(timeout);
      resolve();
    });
  });

  // Login
  const loginResult = await sendCommand(
    `A1 LOGIN "${IMAP_CONFIG.username}" "${IMAP_CONFIG.password}"`,
    "A1"
  );
  if (!loginResult.response.includes("A1 OK")) {
    socket.destroy();
    throw new Error("IMAP login failed: " + loginResult.response);
  }

  // Select INBOX
  await sendCommand("A2 SELECT INBOX", "A2");

  // Search
  const searchQuery = sinceDate
    ? `A3 SEARCH SINCE ${sinceDate}`
    : "A3 SEARCH UNSEEN";
  const searchResult = await sendCommand(searchQuery, "A3");
  const match = searchResult.response.match(/\* SEARCH([\d\s]*)/);
  const messageIds = match && match[1].trim() ? match[1].trim().split(/\s+/) : [];

  const limit = sinceDate ? 50 : 10;
  const ids = messageIds.slice(0, limit);

  if (ids.length > 0) {
    // Batch FETCH all emails in one command (BODY.PEEK[] avoids auto-marking as SEEN)
    const fetchTag = "A4";
    const fetchResult = await sendCommand(
      `${fetchTag} FETCH ${ids.join(",")} (BODY.PEEK[])`,
      fetchTag
    );

    // Parse the multi-email response using literal length markers
    let response = fetchResult.response;
    const fetchRegex = /\* (\d+) FETCH \(BODY\.PEEK\[\] \{(\d+)\}\r\n/g;
    let lastIdx = 0;
    let m;
    while ((m = fetchRegex.exec(response)) !== null) {
      const id = m[1];
      const len = parseInt(m[2], 10);
      const bodyStart = m.index + m[0].length;
      const body = response.substring(bodyStart, bodyStart + len);
      emails.push({ id, raw: body });
      lastIdx = fetchRegex.lastIndex;
    }

    // Mark all as SEEN in a single STORE command
    await sendCommand(`A5 STORE ${ids.join(",")} +FLAGS (\\Seen)`, "A5");
  }

  socket.destroy();
  return emails;
}


function decodeQuotedPrintable(str) {
  return str
    .replace(/=\r\n/g, '')
    .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\t+/g, '\t')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractEmailBody(raw) {
  const plainMatch = raw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--)/i);
  if (plainMatch) {
    const text = decodeQuotedPrintable(plainMatch[1]).trim();
    if (text.length > 50) return text;
  }

  const htmlMatch = raw.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--)/i);
  if (htmlMatch) {
    return stripHtml(decodeQuotedPrintable(htmlMatch[1])).trim();
  }

  const headerEnd = raw.indexOf("\r\n\r\n");
  if (headerEnd > -1) return decodeQuotedPrintable(raw.substring(headerEnd + 4)).trim();

  return raw.trim();
}

function extractSubject(raw) {
  const match = raw.match(/^Subject: (.+?)(?:\r\n(?!\s))/im);
  if (!match) return "";
  return match[1].replace(/\r\n\s+/g, ' ').trim();
}

function extractFrom(raw) {
  const match = raw.match(/^From: (.+?)(?:\r\n(?!\s))/im);
  return match ? match[1].trim() : "";
}

function extractEmailDate(raw) {
  const match = raw.match(/^Date: (.+?)(?:\r\n(?!\s))/im);
  if (!match) return null;
  const parsed = new Date(match[1].trim());
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let sinceDate = null;
    try {
      const body = await req.json();
      if (body?.since) sinceDate = body.since;
    } catch (_) {}

    if (!sinceDate) {
      const now = new Date();
      const day = String(now.getUTCDate()).padStart(2, '0');
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const month = months[now.getUTCMonth()];
      const year = now.getUTCFullYear();
      sinceDate = `${day}-${month}-${year}`;
    }

    const existingLeads = await base44.asServiceRole.entities.Lead.list('-created_date', 500);
    const processedEmailIds = new Set();
    for (const lead of existingLeads) {
      const refMatch = lead.notes?.match(/EmailID: (\d+)/);
      if (refMatch) processedEmailIds.add(refMatch[1]);
    }

    let emails = [];
    try {
      emails = await connectIMAP(sinceDate);
    } catch (err) {
      return Response.json({ error: "IMAP connection failed: " + err.message, processed: 0 });
    }

    if (emails.length === 0) {
      return Response.json({ message: "No new emails", processed: 0 });
    }

    const results = [];

    for (const email of emails) {
      if (processedEmailIds.has(String(email.id))) {
        results.push({ id: email.id, status: "skipped", reason: "Already processed" });
        continue;
      }

      const subject = extractSubject(email.raw);
      const from = extractFrom(email.raw);
      const rawBody = extractEmailBody(email.raw);
      const body = rawBody.includes('<') ? stripHtml(rawBody) : rawBody;
      const emailDate = extractEmailDate(email.raw);

      let autoSource = "Email";
      const fromLower = from.toLowerCase();
      const subjectLower = subject.toLowerCase();
      if (fromLower.includes("autotrader")) autoSource = "Website";
      else if (fromLower.includes("cars.co.za") || fromLower.includes("cars.coza")) autoSource = "Website";
      else if (fromLower.includes("carfind")) autoSource = "Website";
      else if (fromLower.includes("changecars")) autoSource = "Website";
      else if (fromLower.includes("facebook") || subjectLower.includes("facebook")) autoSource = "Facebook";
      else if (fromLower.includes("gumtree")) autoSource = "Website";
      else if (subjectLower.includes("whatsapp")) autoSource = "WhatsApp";

      function regexExtract(body) {
        const result = {};
        const nameMatch = body.match(/Enquiry by[:\s]+([^\n\r]+)/i) || body.match(/Name[:\s]+([^\n\r]+)/i) || body.match(/Customer[:\s]+([^\n\r]+)/i) || body.match(/Contact Name[:\s]+([^\n\r]+)/i);
        if (nameMatch) result.lead_name = nameMatch[1].trim();
        const phoneMatch = body.match(/Contact Number[:\s]+([0-9+\s()-]{7,15})/i) || body.match(/Cell[:\s]+([0-9+\s()-]{7,15})/i) || body.match(/Phone[:\s]+([0-9+\s()-]{7,15})/i) || body.match(/Mobile[:\s]+([0-9+\s()-]{7,15})/i);
        if (phoneMatch) result.phone = phoneMatch[1].trim().replace(/\s+/g, '');
        const emailMatch = body.match(/Email Address[:\s]+([^\s\n\r]+@[^\s\n\r]+)/i) || body.match(/Email[:\s]+([^\s\n\r]+@[^\s\n\r]+)/i);
        if (emailMatch) result.email = emailMatch[1].trim();
        const carMatch = body.match(/Vehicle[:\s]+([^\n\r]{1,150})/i) || body.match(/Car[:\s]+([^\n\r]{1,150})/i);
        if (carMatch) result.car_interested = carMatch[1].trim().substring(0, 150);
        const refMatch = body.match(/Listing ID[:\s]+([^\n\r]+)/i) || body.match(/Lead ID[:\s]+([^\n\r]+)/i) || body.match(/Ref(?:erence)?[:\s#]+([^\n\r]+)/i);
        if (refMatch) result.lead_ref = refMatch[1].trim();
        const msgMatch = body.match(/Message[:\s]+([^\n\r]+(?:\n(?![A-Z][a-z]+:)[^\n\r]+)*)/i);
        if (msgMatch) result.notes = msgMatch[1].trim();
        return result;
      }

      const regexResult = regexExtract(body);

      const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are parsing a car dealership lead notification email. Extract the enquirer's contact information.

Email Subject: ${subject}
Email From: ${from}
Email Body:
${body.substring(0, 4000)}

IMPORTANT RULES:
- lead_name: ONLY the CUSTOMER's real full name (first name + surname). 
  Look carefully in the email body for fields like "Enquiry by:", "Name:", "First Name:", "Surname:", "Customer Name:", "Enquirer:", "Contact Name:".
  Combine first name and surname if they appear separately.
  If no real name is found in the body, return empty string "". 
  DO NOT invent, guess, or use placeholder names like "John Doe".
  DO NOT use dealership names, platform names, or reference numbers as the name.
- phone: the CUSTOMER's actual mobile/cell phone number from "Contact Number:", "Cell:", "Phone:", "Mobile:" fields. Do NOT use lead reference numbers or short codes.
- email: the CUSTOMER's email address from "Email Address:" or "Email:" field (not the platform's email like dealers@cars.co.za)
- car_interested: the vehicle from "Vehicle:" field
- source: one of [Website, Facebook, Instagram, TikTok, WhatsApp, Email, Other]
- notes: the customer's message from the "Message:" field
- lead_ref: the Listing ID or Lead ID reference number

Return ONLY valid JSON.`,
        response_json_schema: {
          type: "object",
          properties: {
            lead_name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            car_interested: { type: "string" },
            source: { type: "string" },
            notes: { type: "string" },
            lead_ref: { type: "string" }
          }
        }
      });

      if (regexResult.lead_name) parsed.lead_name = regexResult.lead_name;
      if (regexResult.phone) parsed.phone = regexResult.phone;
      if (regexResult.email) parsed.email = regexResult.email;
      if (regexResult.car_interested) parsed.car_interested = regexResult.car_interested;
      if (regexResult.lead_ref) parsed.lead_ref = regexResult.lead_ref;
      if (regexResult.notes && !parsed.notes) parsed.notes = regexResult.notes;

      if (!parsed.source || parsed.source === "Email") {
        parsed.source = autoSource;
      }

      if (!parsed.lead_name && !parsed.phone && !parsed.email && !parsed.lead_ref) {
        results.push({ id: email.id, status: "skipped", reason: "No lead info found" });
        continue;
      }

      if (parsed.phone) {
        const existing = await base44.asServiceRole.entities.Lead.filter({ phone: parsed.phone });
        if (existing && existing.length > 0) {
          results.push({ id: email.id, status: "skipped", reason: "Duplicate phone: " + parsed.phone });
          continue;
        }
      }

      let notesText = `[Auto-imported from email]\nEmailID: ${email.id}\nFrom: ${from}\nSubject: ${subject}`;
      if (emailDate) notesText += `\nEmail Date: ${new Date(emailDate).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg" })}`;
      if (parsed.lead_ref) notesText += `\nRef: ${parsed.lead_ref}`;
      if (parsed.notes) notesText += `\n\n${parsed.notes}`;

      const cleanField = (val, maxLen = 200) => {
        if (!val) return "";
        return String(val).replace(/\s+/g, ' ').trim().substring(0, maxLen);
      };

      const leadData = {
        lead_name: cleanField(parsed.lead_name, 100) || "Unknown",
        phone: cleanField(parsed.phone, 20),
        email: cleanField(parsed.email, 100),
        car_interested: cleanField(parsed.car_interested, 200),
        source: parsed.source || "Email",
        status: "New",
        assigned_consultant: "Unassigned",
        notes: notesText.trim().substring(0, 3000),
        email_received_date: emailDate || null,
      };

      await base44.asServiceRole.entities.Lead.create(leadData);
      results.push({ id: email.id, status: "created", lead_name: leadData.lead_name });

      try {
        await base44.asServiceRole.functions.invoke('sendPushNotifications', {
          title: '🚗 New Lead!',
          message: `${leadData.lead_name} is interested in ${leadData.car_interested || 'a vehicle'}. Open the app to respond.`
        });
      } catch (_) {}
    }

    return Response.json({
      message: `Processed ${emails.length} email(s)`,
      results
    });

  } catch (error) {
    return Response.json({ error: error.message, processed: 0 });
  }
});