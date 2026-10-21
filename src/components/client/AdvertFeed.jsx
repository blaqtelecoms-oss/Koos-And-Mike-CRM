import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageCircle, ChevronLeft, ChevronRight, Play, CheckCircle } from "lucide-react";

const GOLD = "#C9A84C";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

function isDirectVideo(url) {
  if (!url) return false;
  // Match file extensions OR base44 media/storage URLs that are not YouTube
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) || 
    (url.includes("media.base44.com") && !getYouTubeId(url));
}

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative w-full aspect-[4/3] bg-black rounded-xl overflow-hidden">
      <img src={images[idx]} alt="" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === idx ? GOLD : "#ffffff50" }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function VideoEmbed({ url }) {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (isDirectVideo(url)) {
    return (
      <video controls className="w-full rounded-xl aspect-video bg-black">
        <source src={url} />
      </video>
    );
  }
  return (
    <a href={url} target="_blank" rel="noreferrer"
      className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold w-fit"
      style={{ borderColor: "#3b82f644", color: "#3b82f6", background: "#3b82f610" }}>
      <Play className="w-4 h-4" /> Watch Video
    </a>
  );
}

function AdvertCard({ ad }) {
  const [expanded, setExpanded] = useState(false);
  const waNumber = ad.whatsapp_number || "27789657049";
  const waMsg = encodeURIComponent(`Hi! I'm interested in the ${ad.title}. Please send me more info.`);
  const descLines = ad.description?.split("\n").filter(Boolean) || [];
  const preview = descLines.slice(0, 4);
  const hasMore = descLines.length > 4;

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: "#111", borderColor: "#C9A84C33" }}>
      {/* Images */}
      {ad.images?.length > 0 && (
        <div className="p-4 pb-0">
          <ImageCarousel images={ad.images} />
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Title + Price */}
        <div>
          <h3 className="text-white font-extrabold text-xl leading-tight">{ad.title}</h3>
          {ad.price && (
            <p className="font-bold text-2xl mt-1" style={{ color: GOLD }}>R {ad.price.toLocaleString()}</p>
          )}
          {ad.finance_available && (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-xs font-semibold">Finance Available (subject to approval)</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
          {(expanded ? descLines : preview).join("\n")}
          {hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="block mt-1 text-xs font-semibold" style={{ color: GOLD }}>
              {expanded ? "Show less ▲" : "Read more ▼"}
            </button>
          )}
        </div>

        {/* Video */}
        {ad.video_url && (
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2 font-semibold">Video</p>
            <VideoEmbed url={ad.video_url} />
          </div>
        )}

        {/* CTA */}
        <a href={`https://wa.me/${waNumber}?text=${waMsg}`} target="_blank" rel="noreferrer">
          <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "#16a34a" }}>
            <MessageCircle className="w-4 h-4" /> WhatsApp About This Vehicle
          </button>
        </a>
      </div>
    </div>
  );
}

export default function AdvertFeed() {
  const { data: adverts = [], isLoading } = useQuery({
    queryKey: ["adverts-public"],
    queryFn: () => base44.entities.Advert.filter({ is_published: true }, "-created_date", 50),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-amber-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (adverts.length === 0) return (
    <section className="max-w-6xl mx-auto px-4 pb-12">
      <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "#C9A84C22", background: "#111" }}>
        <p className="text-2xl mb-2">🚗</p>
        <p className="text-white/50 text-sm">New featured vehicles coming soon — stay tuned!</p>
      </div>
    </section>
  );

  return (
    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-extrabold">🔥 Featured Vehicles</h2>
        <p className="text-white/40 text-sm mt-1">Handpicked deals — contact us directly to enquire</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {adverts.map(ad => <AdvertCard key={ad.id} ad={ad} />)}
      </div>
    </section>
  );
}