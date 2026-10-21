import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const lead = payload.data;

    if (!lead || !lead.email) {
      return Response.json({ message: "No email on lead, skipping." });
    }

    const leadName = lead.lead_name || "Valued Customer";
    const firstName = leadName.split(" ")[0];
    const carLine = lead.car_interested ? ` regarding the <strong>${lead.car_interested}</strong>` : "";

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a1a;padding:28px 36px;text-align:center;">
              <img src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png" alt="Koos &amp; Mike Cars" width="64" height="64" style="border-radius:10px;display:block;margin:0 auto 12px;" />
              <p style="margin:0;color:#c9a84c;font-size:18px;font-weight:700;letter-spacing:0.5px;">Koos &amp; Mike Cars</p>
              <p style="margin:4px 0 0;color:#888;font-size:12px;">Vanderbijlpark | koosandmike.co.za</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 24px;">
              <p style="margin:0 0 16px;font-size:16px;color:#222;">Hi <strong>${firstName}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
                Thank you for contacting us${carLine}. We have received your enquiry and one of our consultants will be in touch with you shortly.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">
                In the meantime, feel free to reach any of our team directly:
              </p>

              <!-- Contact Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;border-radius:6px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#f0f0f0;">
                  <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;" colspan="2">Management</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;width:50%;">Koos</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">069 007 4746</td>
                </tr>

                <tr style="background:#f0f0f0;">
                  <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;" colspan="2">Office / General Enquiries</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Leandri Liversage</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">083 422 8153</td>
                </tr>
                <tr style="background:#f4f4f4;">
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Dorothy K&amp;M</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">071 845 2091</td>
                </tr>

                <tr style="background:#f0f0f0;">
                  <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;" colspan="2">Finance</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Bianca</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">016 100 5575</td>
                </tr>

                <tr style="background:#f0f0f0;">
                  <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;" colspan="2">Sales</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Jaco</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">072 262 9234</td>
                </tr>
                <tr style="background:#f4f4f4;">
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Marius Strydom</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">079 519 7826</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Vuyo</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">067 799 9578</td>
                </tr>

                <tr style="background:#f0f0f0;">
                  <td style="padding:10px 16px;font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.8px;" colspan="2">Workshop</td>
                </tr>
                <tr>
                  <td style="padding:8px 16px;font-size:14px;color:#222;">Christiaan</td>
                  <td style="padding:8px 16px;font-size:14px;color:#555;">078 507 6795</td>
                </tr>
                <tr style="background:#f4f4f4;">
                  <td style="padding:8px 16px 12px 16px;font-size:14px;color:#222;">Nicolene</td>
                  <td style="padding:8px 16px 12px 16px;font-size:14px;color:#555;">072 647 5332</td>
                </tr>
              </table>

              <!-- WhatsApp CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border-radius:6px;border-left:4px solid #25D366;margin-bottom:28px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a6e30;">Join our WhatsApp Group</p>
                    <p style="margin:0;font-size:13px;color:#2e7d32;">Get notified about new stock and special deals:</p>
                    <a href="https://chat.whatsapp.com/KoosAndMikeFamilia" style="display:inline-block;margin-top:8px;font-size:13px;color:#128C7E;font-weight:600;">chat.whatsapp.com/KoosAndMikeFamilia</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#444;">Kind regards,<br/><strong>The Koos &amp; Mike Cars Team</strong></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f7f7f7;padding:18px 36px;border-top:1px solid #e8e8e8;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#999;">Cnr Frikkie Meyer &amp; Faraday Blvd, Vanderbijlpark</p>
              <p style="margin:0;font-size:12px;color:#bbb;">Mon–Fri: 8:00am – 5:00pm &nbsp;|&nbsp; Sun: 9:00am – 1:00pm</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Koos and Mike Cars <leads@koosandmike.co.za>",
        to: [lead.email],
        subject: `Hi ${firstName}, we received your enquiry`,
        html: htmlBody,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      throw new Error(resendData.message || JSON.stringify(resendData));
    }

    return Response.json({ success: true, sent_to: lead.email, id: resendData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});