import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Car, ExternalLink, ArrowLeft, Phone, MessageCircle, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import ClientLayout from "@/components/client/ClientLayout";

export default function ClientInventory() {
  const [search, setSearch] = useState("");
  const [dealerFilter, setDealerFilter] = useState("All");

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-public"],
    queryFn: () => base44.entities.Vehicle.filter({ status: "Available" }),
  });

  const stands = ["All", "Stand 1", "Stand 2", "Stand 3"];

  const filtered = vehicles.filter(v => {
    const matchSearch = !search || `${v.make} ${v.model} ${v.title}`.toLowerCase().includes(search.toLowerCase());
    const matchStand = dealerFilter === "All" || v.stand === dealerFilter;
    return matchSearch && matchStand;
  });

  return (
    <ClientLayout>
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/ClientPortal">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white gap-1">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
          <h1 className="text-white text-3xl font-bold">Available Vehicles</h1>
        </div>

        {/* Website CTA */}
        <div className="rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 border" style={{ background: "#C9A84C15", borderColor: "#C9A84C44" }}>
          <p className="text-sm" style={{ color: "#C9A84C" }}>🌐 For the full up-to-date inventory, visit our website</p>
          <a href="https://www.koosandmike.co.za" target="_blank" rel="noreferrer">
            <Button size="sm" className="gap-2 text-black font-bold" style={{ background: "#C9A84C" }}>
              <ExternalLink className="w-4 h-4" /> koosandmike.co.za
            </Button>
          </a>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search make, model..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {stands.map(s => (
              <Button
                key={s}
                size="sm"
                onClick={() => setDealerFilter(s)}
                variant={dealerFilter === s ? "default" : "outline"}
                style={dealerFilter === s ? { background: "#C9A84C", color: "#000", border: "none" } : {}}
                className={dealerFilter === s ? "" : "border-white/20 text-slate-300 hover:bg-white/10"}
              >
                {s === "All" ? "All Stands" : s}
              </Button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-slate-400 text-sm mb-4">{filtered.length} vehicle{filtered.length !== 1 ? "s" : ""} found</p>

        {/* Vehicle Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Car className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No vehicles found matching your search.</p>
            <a href="https://www.koosandmike.co.za" target="_blank" rel="noreferrer" className="inline-block mt-4">
              <Button className="gap-2 text-black font-bold" style={{ background: "#C9A84C" }}>
                <ExternalLink className="w-4 h-4" /> Check Full Website
              </Button>
            </a>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(v => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  );
}

function VehicleCard({ vehicle }) {
  const whatsappMsg = encodeURIComponent(`Hi! I'm interested in the ${vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}. Please contact me.`);
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-[#C9A84C55] transition-all duration-200 flex flex-col">
      <div className="h-48 bg-slate-800 flex items-center justify-center relative">
        {vehicle.images && vehicle.images[0]
          ? vehicle.website_slug
            ? (
              <a href={`https://www.koosandmike.co.za/vehicle/${vehicle.website_slug}`} target="_blank" rel="noreferrer" className="block w-full h-full group">
                <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <ExternalLink className="w-8 h-8 text-white" />
                </div>
              </a>
            )
            : <img src={vehicle.images[0]} alt={vehicle.title} className="w-full h-full object-cover" />
          : <Car className="w-16 h-16 text-slate-600" />
        }
        {vehicle.finance_available && (
          <Badge className="absolute top-3 right-3 bg-green-600 text-white text-xs">Finance Available</Badge>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-white font-bold text-base mb-1 leading-tight">
          {vehicle.title || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
        </h3>
        <p className="text-slate-400 text-xs mb-1">{vehicle.stand || ""}</p>
        {vehicle.mileage && <p className="text-slate-400 text-xs mb-3">{vehicle.mileage.toLocaleString()} km</p>}
        {vehicle.price && (
          <p className="font-bold text-xl mb-4" style={{ color: "#C9A84C" }}>R {vehicle.price.toLocaleString()}</p>
        )}
        <div className="flex gap-2 mt-auto">
          <a href={`https://wa.me/27000000000?text=${whatsappMsg}`} target="_blank" rel="noreferrer" className="flex-1">
            <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white gap-1">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </Button>
          </a>
          <Link to="/ClientRegister" className="flex-1">
            <Button size="sm" variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 gap-1">
              <Phone className="w-3 h-3" /> Enquire
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}