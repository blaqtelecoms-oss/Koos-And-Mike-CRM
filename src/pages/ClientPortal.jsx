import { MessageCircle, Star, ArrowRight, Search, RefreshCw, UserPlus, ExternalLink, Car, Radio, Phone, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdvertFeed from "@/components/client/AdvertFeed";

const GOLD = "#C9A84C";

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

export default function ClientPortal() {
  return (
    <div className="min-h-screen" style={{ background: "var(--app-canvas)" }}>
      {/* Gold top accent */}
      <div className="h-1 w-full" style={{ background: GOLD }} />

      {/* Header */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-sm" style={{ background: "rgba(255,255,255,0.85)", borderColor: "#C9A84C22" }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png"
              alt="Koos & Mike Cars"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="font-bold text-lg leading-none" style={{ color: GOLD }}>Koos & Mike Cars</h1>
              <p className="text-xs" style={{ color: "#C9A84C77" }}>Your Trusted Car Portal</p>
            </div>
          </div>
          <a href="https://wa.me/27789657049" target="_blank" rel="noreferrer">
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp Us
            </Button>
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium mb-6 border" style={{ background: "#C9A84C18", borderColor: "#C9A84C44", color: GOLD }}>
          <Star className="w-4 h-4" /> Quality Cars You Can Trust
        </div>
        <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          Find Your Perfect<br /><span style={{ color: GOLD }}>Car Today</span>
        </h2>
        <p className="text-gray-700 text-xl max-w-2xl mx-auto mb-10">
          Browse vehicles, register your interest, trade in your car, or let us find exactly what you're looking for — all in one place.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="https://www.koosandmike.co.za" target="_blank" rel="noreferrer">
            <Button className="px-8 py-6 text-lg rounded-xl gap-2 font-bold text-black" style={{ background: GOLD }}>
              <Search className="w-5 h-5" /> Browse Inventory
            </Button>
          </a>
          <Link to="/ClientRegister">
            <Button variant="outline" className="px-8 py-6 text-lg rounded-xl gap-2" style={{ borderColor: "#C9A84C55", color: GOLD, background: "transparent" }}>
              <UserPlus className="w-5 h-5" /> Register My Interest
            </Button>
          </Link>
          <a href="https://zeno.fm/radio/KM-radio-neog/" target="_blank" rel="noreferrer">
            <Button variant="outline" className="px-8 py-6 text-lg rounded-xl gap-2" style={{ borderColor: "#C9A84C55", color: GOLD, background: "transparent" }}>
              <Radio className="w-5 h-5" /> 🎵 K&M Music Station
            </Button>
          </a>
        </div>
      </section>

      {/* WhatsApp Group Banner */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <a href="https://chat.whatsapp.com/FbOqA3UJ0eS6FccdmV7Zdu" target="_blank" rel="noreferrer">
          <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border transition-all hover:border-green-500/50 cursor-pointer"
            style={{ background: "#16a34a0D", borderColor: "#16a34a33" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#16a34a20" }}>
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-gray-900 font-bold">Join Our WhatsApp Group</p>
                <p className="text-gray-500 text-sm">Get first access to new stock, deals & updates directly on WhatsApp</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-gray-900 flex-shrink-0"
              style={{ background: "#16a34a" }}>
              <MessageCircle className="w-4 h-4" /> Join Group
            </button>
          </div>
        </a>
      </section>

      {/* Featured Adverts Feed */}
      <AdvertFeed />

      {/* HelloPeter Rating Section */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="rounded-2xl border overflow-hidden" style={{ background: "var(--glass)", borderColor: "#C9A84C33" }}>
          {/* Header bar */}
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ background: "#C9A84C12", borderColor: "#C9A84C33" }}>
            <ShieldCheck className="w-5 h-5" style={{ color: GOLD }} />
            <span className="font-bold text-gray-900 text-sm">Verified on HelloPeter — South Africa's #1 Consumer Review Platform</span>
            <a href="https://www.hellopeter.com/koos-and-mike-used-vehicles" target="_blank" rel="noreferrer"
              className="ml-auto text-xs underline" style={{ color: GOLD }}>
              View All Reviews →
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0" style={{ borderColor: "#C9A84C22" }}>
            <StatBox emoji="⭐" value="4.98 / 5" label="Rating" sub="Last 12 months" />
            <StatBox emoji="📝" value="325" label="Reviews" sub="Verified customers" />
            <StatBox emoji="🏆" value="#11" label="Ranked in SA" sub="Used Cars category" />
            <StatBox emoji="💯" value="63 NPS" label="Recommended" sub="Very Likely" />
          </div>

          {/* Star breakdown */}
          <div className="px-6 py-5 border-t" style={{ borderColor: "#C9A84C22" }}>
            <div className="flex flex-col gap-2 max-w-sm">
              {[
                { stars: 5, pct: 98.5 },
                { stars: 4, pct: 1.5 },
                { stars: 3, pct: 0 },
              ].map(({ stars, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">{stars}★</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(0,0,0,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: GOLD }} />
                  </div>
                  <span className="text-xs w-10" style={{ color: GOLD }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Review snippets */}
          <div className="px-6 pb-6 border-t" style={{ borderColor: "#C9A84C22" }}>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold py-4">What our customers say</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REVIEWS.map((r) => (
                <div key={r.author} className="rounded-xl p-4 border" style={{ background: "#ffffff06", borderColor: "#C9A84C20" }}>
                  <div className="flex gap-0.5 mb-2">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-current" style={{ color: GOLD }} />)}
                  </div>
                  <p className="text-gray-700 text-xs leading-relaxed mb-3">"{r.text}"</p>
                  <p className="text-xs font-semibold" style={{ color: GOLD }}>— {r.author}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <a href="https://www.hellopeter.com/koos-and-mike-used-vehicles" target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2 text-sm" style={{ borderColor: "#C9A84C44", color: GOLD, background: "transparent" }}>
                  <ExternalLink className="w-4 h-4" /> Read All 325 Reviews on HelloPeter
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Service Cards */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            icon={<Radio className="w-7 h-7" style={{ color: GOLD }} />}
            title="🎵 K&M Music Station"
            desc="Tune in to Koos & Mike's very own radio station — great music while you browse!"
            href="https://zeno.fm/radio/KM-radio-neog/"
            cta="Listen Now"
            external
          />
          <ServiceCard
            icon={<UserPlus className="w-7 h-7" style={{ color: GOLD }} />}
            title="Register as Lead"
            desc="Tell us what you're looking for and we'll find the right car for you."
            link="/ClientRegister"
            cta="Register Now"
          />
          <ServiceCard
            icon={<RefreshCw className="w-7 h-7" style={{ color: GOLD }} />}
            title="Trade In Your Car"
            desc="Submit your vehicle details and we'll give you a fair trade-in offer."
            link="/ClientTradeIn"
            cta="Submit Trade-In"
          />
          <ServiceCard
            icon={<Car className="w-7 h-7" style={{ color: GOLD }} />}
            title="Request a Car"
            desc="Can't find what you want? Tell us and we'll search for it for you."
            link="/ClientCarRequest"
            cta="Request Now"
          />
        </div>
      </section>

      {/* Sales Team Contact */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#C9A84C33" }}>
          <div className="px-6 py-5 border-b" style={{ background: "#C9A84C12", borderColor: "#C9A84C33" }}>
            <h3 className="text-gray-900 text-xl font-bold flex items-center gap-2">
              <Phone className="w-5 h-5" style={{ color: GOLD }} /> Talk to Our Sales Team
            </h3>
            <p className="text-gray-500 text-sm mt-1">Call or WhatsApp any of our consultants directly</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y" style={{ borderColor: "#C9A84C15", background: "transparent" }}>
            {TEAM.map((member) => (
              <div key={member.name} className="p-4 flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg"
                  style={{ background: GOLD }}>
                  {member.name[0]}
                </div>
                <div>
                  <p className="text-gray-900 font-semibold text-sm">{member.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{member.phone}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`tel:${member.phone.replace(/\s/g, "")}`}>
                    <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ background: "#C9A84C22", border: "1px solid #C9A84C44" }}>
                      <Phone className="w-3.5 h-3.5" style={{ color: GOLD }} />
                    </button>
                  </a>
                  <a href={`https://wa.me/${member.wa}`} target="_blank" rel="noreferrer">
                    <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ background: "#16a34a22", border: "1px solid #16a34a44" }}>
                      <MessageCircle className="w-3.5 h-3.5 text-green-400" />
                    </button>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Website Banner */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 border" style={{ background: "#C9A84C0D", borderColor: "#C9A84C33" }}>
          <div>
            <h3 className="text-gray-900 text-2xl font-bold mb-2">Full Inventory Online</h3>
            <p className="text-gray-600">Visit our website for the complete, up-to-date vehicle listing.</p>
          </div>
          <a href="https://www.koosandmike.co.za" target="_blank" rel="noreferrer">
            <Button className="gap-2 px-8 py-6 text-lg font-bold rounded-xl whitespace-nowrap text-black" style={{ background: GOLD }}>
              <ExternalLink className="w-5 h-5" /> Visit Website
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs" style={{ borderColor: "#C9A84C22", color: "#ffffff33" }}>
        © 2026 Koos & Mike Cars · Quality Vehicles, Trusted Service.
      </footer>
    </div>
  );
}

function StatBox({ emoji, value, label, sub }) {
  return (
    <div className="p-5 text-center" style={{ background: "transparent" }}>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-extrabold text-gray-900">{value}</div>
      <div className="text-xs font-semibold mt-0.5" style={{ color: GOLD }}>{label}</div>
      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
    </div>
  );
}

function ServiceCard({ icon, title, desc, link, href, cta, external }) {
  const inner = (
    <div className="rounded-2xl p-6 cursor-pointer transition-all duration-200 group h-full flex flex-col border hover:border-[#C9A84C55]"
      style={{ background: "rgba(0,0,0,0.03)", borderColor: "var(--line)" }}>
      <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-4" style={{ background: "#C9A84C15" }}>
        {icon}
      </div>
      <h3 className="text-gray-900 font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm flex-1 mb-4">{desc}</p>
      <div className="flex items-center font-semibold text-sm gap-1 transition-all" style={{ color: GOLD }}>
        {cta} <ArrowRight className="w-4 h-4" />
      </div>
    </div>
  );

  if (external && href) return <a href={href} target="_blank" rel="noreferrer">{inner}</a>;
  return <Link to={link}>{inner}</Link>;
}