import { Link, useLocation } from "react-router-dom";
import { Home, Car, Plus, UserPlus, MessageCircle } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/27695498731";

const ITEMS = [
  { label: "Home", to: "/ClientPortal", icon: Home },
  { label: "Stock", to: "/ClientInventory", icon: Car },
  { label: "Sell", to: "/ClientTradeIn", icon: Plus, center: true },
  { label: "Register", to: "/ClientRegister", icon: UserPlus },
  { label: "Chat", href: WHATSAPP_URL, icon: MessageCircle, external: true },
];

export default function ClientBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Client portal quick navigation"
      className="fixed inset-x-0 z-50 flex justify-center px-4 min-[980px]:hidden"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
    >
      <div
        className="flex w-full max-w-md items-center justify-around rounded-[26px] border px-2 py-2"
        style={{
          background: "rgba(255,253,247,0.94)",
          borderColor: "rgba(201,168,76,0.35)",
          boxShadow: "0 18px 40px rgba(60,45,10,0.18)",
          backdropFilter: "blur(16px)",
        }}
      >
        {ITEMS.map(({ label, to, href, icon: Icon, center, external }) => {
          const active = to === pathname;

          const inner = center ? (
            <span
              className="flex h-12 w-12 items-center justify-center rounded-full text-white"
              style={{
                background: "linear-gradient(135deg, var(--gold), var(--gold-deep))",
                boxShadow: "0 10px 22px rgba(201,168,76,0.45)",
              }}
            >
              <Icon className="h-6 w-6" strokeWidth={2.4} />
            </span>
          ) : (
            <span
              className="flex flex-col items-center gap-0.5 px-2 py-1"
              style={{ color: active ? "var(--gold)" : "#8a8272" }}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </span>
          );

          const aria = external ? { target: "_blank", rel: "noreferrer" } : {};

          return external ? (
            <a key={label} href={href} aria-label={label} {...aria}>{inner}</a>
          ) : (
            <Link key={label} to={to} aria-label={label} aria-current={active ? "page" : undefined}>
              {inner}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
