import { useState } from "react";
import {
  ArrowRight, Car, ExternalLink, MessageCircle, Phone, Radio, RefreshCw,
  Search, ShieldCheck, SlidersHorizontal, Star, UserPlus, Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import AdvertFeed from "@/components/client/AdvertFeed";
import ClientLayout from "@/components/client/ClientLayout";
import { PUBLIC_ASSETS } from "@/lib/supabaseUrl";

const GOLD = "var(--gold)";
const WHATSAPP_URL = "https://wa.me/27695498731";
const CARD_BORDER = "rgba(201,168,76,0.28)";
const CARD_BG = "var(--glass)";

const TEAM = [
  { name: "Koos", phone: "069 007 4746", wa: "27690074746" },
  { name: "Heino", phone: "078 965 7049", wa: "27789657049" },
  { name: "Jaco", phone: "072 262 9234", wa: "27722629234" },
  { name: "Leandri", phone: "083 422 8153", wa: "27834228153" },
  { name: "Vuyo", phone: "087 894 3405", wa: "27878943405" },
  { name: "Marius", phone: "079 519 7826", wa: "27795197826" },
];

const REVIEWS = [
  { author: "Mandddp", text: "Went to view a car, liked it — collected it, all in 3 hours! Top service, from sales to finance. 10/10 recommend 👏" },
  { author: "Riaan K", text: "Excellent service!! Finance was obtained and we managed to drive out with the Ford same day. I really did not think the car would be delivered same day!" },
  { author: "Allan F", text: "What a wonderful experience dealing with Koos, Marius and Sylvia. Buying a car unseen was daunting, but I am very satisfied. I would highly recommend them!" },
  { author: "David", text: "They've managed to structure a deal for me in a space of 3 days and I'm happy with my car — it's immaculate ✨" },
  { author: "nando", text: "Their team went the extra mile and kept me informed every step of the way. I truly appreciated the great service." },
  { author: "Kuhle", text: "Best dealer in town selling quality cars. Their staff is very professional and always willing to help." },
];

const QUICK_LINKS = [
  { label: "All Stock", to: "/ClientInventory", icon: Car },
  { label: "Finance", to: "/ClientInventory?finance=1", icon: ShieldCheck },
  { label: "Trade-In", to: "/ClientTradeIn", icon: RefreshCw },
  { label: "Request a Car", to: "/ClientCarRequest", icon: Search },
];

const greetingFor = (hour) => (hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!");

export default function ClientPortal() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const greeting = greetingFor(new Date().getHours());

  const submitSearch = (event) => {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/ClientInventory?q=${encodeURIComponent(term)}` : "/ClientInventory");
  };

  return (
    <ClientLayout>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Welcome row */}
        <div className="flex items-center justify-between gap-3 pb-4 pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={`${PUBLIC_ASSETS}/km-logo-round.png`}
              alt="Koos & Mike Cars"
              className="h-11 w-11 shrink-0 rounded-full border object-contain p-0.5"
              style={{ borderColor: CARD_BORDER, background: "rgba(255,255,255,0.7)" }}
            />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: "#a08a4f" }}>{greeting}</p>
              <p className="truncate text-lg font-extrabold leading-tight" style={{ color: "var(--ink)" }}>Let's find your next ride</p>
            </div>
          </div>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: CARD_BORDER, background: "rgba(255,255,255,0.8)", color: "#128C4A" }}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
          </a>
        </div>

        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-[28px] p-6 sm:p-10"
          style={{ background: "linear-gradient(135deg, #ffe9b3 0%, #f3c452 48%, #dda015 100%)" }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full" style={{ background: "rgba(255,255,255,0.32)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="relative">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold"
              style={{ borderColor: "rgba(36,27,5,0.16)", background: "rgba(255,255,255,0.4)", color: "#3a2c07" }}
            >
              <Star className="h-3 w-3 fill-current" /> Quality Cars You Can Trust
            </span>
            <h1 className="mt-4 text-[32px] font-extrabold leading-[1.05] tracking-tight sm:text-5xl" style={{ color: "#241b05" }}>
              Find Your Perfect<br />Ride
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed sm:text-base" style={{ color: "#4a3a0a" }}>
              Browse certified vehicles, trade in your car, or let us find exactly what you're looking for — all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/ClientInventory"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold"
                style={{ background: "#1c1c1c", color: "#fff" }}
              >
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/ClientTradeIn"
                className="inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-bold"
                style={{ background: "rgba(255,255,255,0.65)", color: "#241b05" }}
              >
                Sell Your Car
              </Link>
            </div>
          </div>
        </section>

        {/* Search */}
        <form onSubmit={submitSearch} className="mt-4 flex items-center gap-2">
          <div className="flex h-12 flex-1 items-center gap-2 rounded-full border px-4" style={{ borderColor: CARD_BORDER, background: CARD_BG }}>
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--mut)" }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search make, model, or keyword…"
              aria-label="Search vehicles"
              className="h-full w-full bg-transparent text-base outline-none sm:text-sm"
              style={{ color: "var(--ink)" }}
            />
          </div>
          <Link
            to="/ClientInventory"
            aria-label="Open inventory filters"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border"
            style={{ borderColor: CARD_BORDER, background: CARD_BG, color: "var(--ink)" }}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Link>
        </form>

        {/* Quick category chips */}
        <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-xs font-bold"
              style={{ borderColor: CARD_BORDER, background: CARD_BG, color: "var(--ink)" }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: GOLD }} /> {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Featured vehicles */}
      <AdvertFeed />

      {/* WhatsApp Group Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <a
          href="https://chat.whatsapp.com/FbOqA3UJ0eS6FccdmV7Zdu"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between gap-3 rounded-[24px] border p-4 transition-colors sm:p-5"
          style={{ background: "#16a34a12", borderColor: "#16a34a33" }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: "#16a34a22" }}>
              <Users className="h-5 w-5" style={{ color: "#16a34a" }} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>Join Our WhatsApp Group</p>
              <p className="truncate text-xs" style={{ color: "var(--mut)" }}>New stock, deals &amp; updates first</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold text-white" style={{ background: "#16a34a" }}>
            <MessageCircle className="h-3.5 w-3.5" /> Join
          </span>
        </a>
      </section>

      {/* HelloPeter Rating Section */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-[24px] border" style={{ background: CARD_BG, borderColor: CARD_BORDER }}>
          {/* Header bar */}
          <div className="flex items-center gap-2 border-b px-4 py-3 sm:px-6" style={{ background: "#C9A84C12", borderColor: "#C9A84C33" }}>
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: GOLD }} />
            <span className="min-w-0 truncate text-xs font-bold" style={{ color: "var(--ink)" }}>
              Verified on HelloPeter
            </span>
            <a
              href="https://www.hellopeter.com/koos-and-mike-used-vehicles"
              target="_blank"
              rel="noreferrer"
              className="ml-auto shrink-0 text-[11px] font-bold underline"
              style={{ color: GOLD }}
            >
              View all
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 divide-x divide-y divide-[#c9a84c22] sm:grid-cols-4 sm:divide-y-0">
            <StatBox emoji="⭐" value="4.98 / 5" label="Rating" sub="Last 12 months" />
            <StatBox emoji="📝" value="325" label="Reviews" sub="Verified customers" />
            <StatBox emoji="🏆" value="#11" label="Ranked in SA" sub="Used Cars category" />
            <StatBox emoji="💯" value="63 NPS" label="Recommended" sub="Very Likely" />
          </div>

          {/* Star breakdown */}
          <div className="border-t px-4 py-4 sm:px-6" style={{ borderColor: "#C9A84C22" }}>
            <div className="flex max-w-sm flex-col gap-2">
              {[
                { stars: 5, pct: 98.5 },
                { stars: 4, pct: 1.5 },
                { stars: 3, pct: 0 },
              ].map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="w-8 text-xs" style={{ color: "var(--mut)" }}>{stars}★</span>
                  <div className="h-2 flex-1 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: GOLD }} />
                  </div>
                  <span className="w-10 text-xs" style={{ color: GOLD }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review snippets */}
          <div className="border-t px-4 pb-5 pt-4 sm:px-6" style={{ borderColor: "#C9A84C22" }}>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--mut)" }}>What our customers say</p>
            <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-3 md:overflow-visible">
              {REVIEWS.map((r) => (
                <div
                  key={r.author}
                  className="w-[80%] shrink-0 snap-center rounded-2xl border p-4 sm:w-auto"
                  style={{ background: "rgba(0,0,0,0.02)", borderColor: "#C9A84C20" }}
                >
                  <div className="mb-2 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="h-3 w-3 fill-current" style={{ color: GOLD }} />)}
                  </div>
                  <p className="mb-3 text-xs leading-relaxed" style={{ color: "var(--mut)" }}>"{r.text}"</p>
                  <p className="text-xs font-bold" style={{ color: GOLD }}>— {r.author}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a href="https://www.hellopeter.com/koos-and-mike-used-vehicles" target="_blank" rel="noreferrer">
                <button
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold"
                  style={{ borderColor: "#C9A84C44", color: GOLD, background: "transparent" }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Read all 325 reviews
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <ServiceCard
            icon={<Radio className="h-6 w-6" style={{ color: GOLD }} />}
            title="🎵 K&M Music Station"
            desc="Tune in to Koos & Mike's very own radio station — great music while you browse!"
            href="https://zeno.fm/radio/KM-radio-neog/"
            cta="Listen Now"
            external
          />
          <ServiceCard
            icon={<UserPlus className="h-6 w-6" style={{ color: GOLD }} />}
            title="Register as Lead"
            desc="Tell us what you're looking for and we'll find the right car for you."
            link="/ClientRegister"
            cta="Register Now"
          />
          <ServiceCard
            icon={<RefreshCw className="h-6 w-6" style={{ color: GOLD }} />}
            title="Trade In Your Car"
            desc="Submit your vehicle details and we'll give you a fair trade-in offer."
            link="/ClientTradeIn"
            cta="Submit Trade-In"
          />
          <ServiceCard
            icon={<Car className="h-6 w-6" style={{ color: GOLD }} />}
            title="Request a Car"
            desc="Can't find what you want? Tell us and we'll search for it for you."
            link="/ClientCarRequest"
            cta="Request Now"
          />
        </div>
      </section>

      {/* Sales Team Contact */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: CARD_BORDER }}>
          <div className="border-b px-4 py-4 sm:px-6" style={{ background: "#C9A84C12", borderColor: "#C9A84C33" }}>
            <h3 className="flex items-center gap-2 text-base font-extrabold sm:text-lg" style={{ color: "var(--ink)" }}>
              <Phone className="h-4 w-4" style={{ color: GOLD }} /> Talk to Our Sales Team
            </h3>
            <p className="mt-1 text-xs" style={{ color: "var(--mut)" }}>Call or WhatsApp any of our consultants directly</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-[#c9a84c22] sm:grid-cols-3 lg:grid-cols-6">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center gap-2 p-4 text-center">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full text-base font-extrabold"
                  style={{ background: "linear-gradient(135deg, var(--gold-light), var(--gold-deep))", color: "#241b05" }}
                >
                  {member.name[0]}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{member.name}</p>
                  <p className="mt-0.5 text-[11px]" style={{ color: "var(--mut)" }}>{member.phone}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${member.phone.replace(/\s/g, "")}`} aria-label={`Call ${member.name}`}>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "#C9A84C22", border: "1px solid #C9A84C44" }}
                    >
                      <Phone className="h-3.5 w-3.5" style={{ color: GOLD }} />
                    </span>
                  </a>
                  <a href={`https://wa.me/${member.wa}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${member.name}`}>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-opacity hover:opacity-80"
                      style={{ background: "#16a34a22", border: "1px solid #16a34a44" }}
                    >
                      <MessageCircle className="h-3.5 w-3.5" style={{ color: "#16a34a" }} />
                    </span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Banner */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div
          className="flex flex-col gap-4 rounded-[24px] border p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ background: "#C9A84C0D", borderColor: CARD_BORDER }}
        >
          <div>
            <h3 className="text-lg font-extrabold sm:text-2xl" style={{ color: "var(--ink)" }}>Full Inventory Online</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--mut)" }}>Visit our website for the complete, up-to-date vehicle listing.</p>
          </div>
          <a
            href="https://www.koosandmike.co.za"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold"
            style={{ background: "var(--ink)", color: "var(--bg)" }}
          >
            <ExternalLink className="h-4 w-4" /> Visit Website
          </a>
        </div>
      </section>
    </ClientLayout>
  );
}

function StatBox({ emoji, value, label, sub }) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="text-lg">{emoji}</div>
      <div className="text-lg font-extrabold sm:text-xl" style={{ color: "var(--ink)" }}>{value}</div>
      <div className="text-[11px] font-bold" style={{ color: GOLD }}>{label}</div>
      <div className="text-[10px]" style={{ color: "var(--mut)" }}>{sub}</div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, link, href, cta, external }) {
  const inner = (
    <div
      className="flex h-full cursor-pointer flex-col rounded-[24px] border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "#C9A84C15" }}>
        {icon}
      </div>
      <h3 className="text-base font-bold" style={{ color: "var(--ink)" }}>{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed" style={{ color: "var(--mut)" }}>{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold" style={{ color: GOLD }}>
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </div>
  );

  if (external && href) return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
  return <Link to={link}>{inner}</Link>;
}
