import LegalPage from "@/components/client/LegalPage";

const SECTIONS = [
  {
    heading: "1. Who we are",
    body: [
      "Koos & Mike Cars is a pre-owned vehicle dealership based in South Africa. This policy explains how we collect, use and protect your personal information when you use our client portal (browsing our vehicles, registering your interest, submitting a trade-in or requesting a vehicle) and when you contact us.",
      "We process personal information in line with the Protection of Personal Information Act, 2013 (POPIA).",
    ],
  },
  {
    heading: "2. Information we collect",
    body: [
      "Details you give us: your name, contact numbers, email address, the vehicle you are interested in, trade-in details (vehicle description, mileage, photos), finance-related information you choose to share, and the content of messages you send us.",
      "Details collected automatically: basic technical information needed to run the portal, such as your browser type and the pages you visit. We do not run advertising trackers on this portal.",
    ],
  },
  {
    heading: "3. How we use your information",
    body: [
      "To respond to your enquiry, show you relevant vehicles, arrange viewings or test drives, assess a trade-in, and follow up on your request.",
      "To contact you about your enquiry by phone, WhatsApp, SMS or email, and to keep a record of our correspondence.",
      "To meet our legal, tax, warranty and record-keeping obligations, and to prevent fraud.",
    ],
  },
  {
    heading: "4. Sharing your information",
    body: [
      "We share information only where it is needed: with finance houses and insurers if you ask us to arrange finance or insurance, with service providers who host or support this portal, and with authorities where the law requires it.",
      "We do not sell your personal information to anyone.",
    ],
  },
  {
    heading: "5. How long we keep it",
    body: [
      "We keep enquiry records for as long as needed to help you and to meet legal requirements. If you ask us to delete your information and we are not required to keep it, we will delete or de-identify it.",
    ],
  },
  {
    heading: "6. Your rights",
    body: [
      "Under POPIA you may ask us to confirm what personal information we hold about you, to correct or delete it, or to stop using it for marketing. You may also object to processing and, if you are unhappy with our response, complain to the Information Regulator (South Africa).",
      "To exercise any of these rights, contact us using the details at the bottom of this page.",
    ],
  },
  {
    heading: "7. Security",
    body: [
      "We use reasonable technical and organisational measures to protect your information, including access controls on our systems. No method of transmission over the internet is completely secure, so please avoid sending sensitive documents such as ID copies over unsecured channels unless we have agreed on a safe method.",
    ],
  },
  {
    heading: "8. Changes to this policy",
    body: [
      "We may update this policy from time to time. The latest version will always be available on this page, with the date it was last updated.",
    ],
  },
];

export default function ClientPrivacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="25 November 2026"
      intro="Your privacy matters to us. This policy explains what personal information Koos & Mike Cars collects through this portal, why we collect it, and the choices you have."
      sections={SECTIONS}
    />
  );
}
