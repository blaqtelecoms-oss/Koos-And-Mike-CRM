import ClientLayout from "@/components/client/ClientLayout";

const INK = "#17130a";
const BODY = "#4b463a";

export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <ClientLayout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ color: INK, letterSpacing: "-0.6px" }}>
          {title}
        </h1>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-8" style={{ color: "#a08a4f" }}>
          Last updated {updated}
        </p>

        {intro && (
          <p className="text-[15px] leading-relaxed mb-8" style={{ color: BODY }}>
            {intro}
          </p>
        )}

        <div className="space-y-7">
          {sections.map(({ heading, body }) => (
            <section key={heading}>
              <h2 className="text-base font-bold mb-2" style={{ color: INK }}>{heading}</h2>
              <div className="space-y-2 text-[15px] leading-relaxed" style={{ color: BODY }}>
                {body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t text-sm" style={{ borderColor: "#C9A84C33", color: "var(--mut)" }}>
          Questions about this document? Message us on WhatsApp at 069 549 8731 or visit{" "}
          <a
            href="https://www.koosandmike.co.za"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
            style={{ color: "var(--gold-deep)" }}
          >
            koosandmike.co.za
          </a>
          .
        </div>
      </article>
    </ClientLayout>
  );
}
