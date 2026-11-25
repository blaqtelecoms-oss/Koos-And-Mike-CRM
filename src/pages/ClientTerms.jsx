import LegalPage from "@/components/client/LegalPage";

const SECTIONS = [
  {
    heading: "1. About these terms",
    body: [
      "These terms apply when you use the Koos & Mike Cars client portal: browsing our vehicle stock, registering your interest, submitting a trade-in, or requesting a specific vehicle. By using the portal you agree to them.",
    ],
  },
  {
    heading: "2. Vehicle information",
    body: [
      "We describe our vehicles as accurately as we can, but listings, specifications, mileage and photographs are provided in good faith and may contain errors or change without notice. A vehicle shown on the portal may already be sold or reserved.",
      "Prices shown are asking prices and exclude any additional costs such as licensing, registration or delivery, unless stated otherwise. The price that applies to you is the one confirmed in your written deal with us.",
    ],
  },
  {
    heading: "3. Enquiries are not a contract",
    body: [
      "Submitting a form, registering interest, requesting a vehicle or sending us a message is an enquiry only. No sale, reservation or finance agreement exists until we both sign a written agreement and any agreed deposit is received.",
      "Finance is subject to approval by the relevant finance provider, and trade-in values are indicative until we have inspected the vehicle.",
    ],
  },
  {
    heading: "4. Using the portal",
    body: [
      "Please use the portal lawfully and give us accurate information. Do not submit content that is false, misleading, offensive, or that infringes someone else's rights, and do not attempt to interfere with the portal's operation or security.",
    ],
  },
  {
    heading: "5. Messages and contact",
    body: [
      "If you give us your contact details, you agree that we may contact you about your enquiry by phone, WhatsApp, SMS or email. You can ask us to stop marketing contact at any time.",
    ],
  },
  {
    heading: "6. Intellectual property",
    body: [
      "The content on this portal, including our name, logo, text and photographs, belongs to us or is used with permission. You may not copy or reuse it for commercial purposes without our written consent.",
    ],
  },
  {
    heading: "7. Third-party links and services",
    body: [
      "The portal links to third-party services such as WhatsApp, our website and our radio station. We are not responsible for the content or practices of those services; their own terms and privacy policies apply.",
    ],
  },
  {
    heading: "8. Limitation of liability",
    body: [
      "The portal is provided as is. To the extent permitted by law, we are not liable for indirect or consequential loss arising from your use of the portal, or for interruptions or errors beyond our reasonable control. Nothing in these terms limits rights you have under South African consumer law.",
    ],
  },
  {
    heading: "9. Privacy",
    body: [
      "How we handle your personal information is explained in our Privacy Policy, which forms part of these terms.",
    ],
  },
  {
    heading: "10. Governing law and changes",
    body: [
      "These terms are governed by the laws of South Africa. We may update them from time to time; the latest version will always be on this page.",
    ],
  },
];

export default function ClientTerms() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="25 November 2026"
      intro="These terms govern your use of the Koos & Mike Cars client portal and the enquiries you send us through it."
      sections={SECTIONS}
    />
  );
}
