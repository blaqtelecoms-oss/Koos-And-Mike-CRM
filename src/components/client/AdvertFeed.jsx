import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/supabaseClient";
import { MessageCircle, ChevronLeft, ChevronRight, Play, CheckCircle, Car } from "lucide-react";

const GOLD = "var(--gold)";
const CARD_BORDER = "rgba(201,168,76,0.28)";

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?\s]+)/);
  return match ? match[1] : null;
}

function isDirectVideo(url) {
  if (!url) return false;
  // Match file extensions OR Supabase storage URLs that are not YouTube
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ||
    (url.includes("/storage/v1/object/public/") && !getYouTubeId(url));
}

function ImageCarousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/5">
      <img src={images[idx]} alt="" className="h-full w-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm hover:bg-white"
          >
            <ChevronLeft className="h-4 w-4 text-[#241b05]" />
          </button>
          <button
            onClick={() => setIdx(i => (i + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-sm hover:bg-white"
          >
            <ChevronRight className="h-4 w-4 text-[#241b05]" />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Photo ${i + 1}`}
                className="h-1.5 w-1.5 rounded-full transition-all"
                style={{ background: i === idx ? GOLD : "#ffffff90" }}
              />
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
      <div className="aspect-video w-full overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (isDirectVideo(url)) {
    return (
      <video controls className="aspect-video w-full rounded-xl bg-black/5">
        <source src={url} />
      </video>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold"
      style={{ borderColor: "#3b82f644", color: "#3b82f6", background: "#3b82f610" }}
    >
      <Play className="h-3.5 w-3.5" /> Watch Video
    </a>
  );
}

function AdvertCard({ ad }) {
  const [expanded, setExpanded] = useState(false);
  const waNumber = ad.whatsapp_number || "27789657049";
  const waMsg = encodeURIComponent(`Hi! I'm interested in the ${ad.title}. Please send me more info.`);
  const descLines = ad.description?.split("\n").filter(Boolean) || [];
  const preview = descLines.slice(0, 2);
  const hasMore = descLines.length > 2;

  return (
    <article
      className="w-[86%] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-[26px] border md:w-auto md:max-w-none"
      style={{ background: "var(--glass)", borderColor: CARD_BORDER }}
    >
      {/* Images */}
      <div className="relative">
        {ad.images?.length > 0 ? (
          <ImageCarousel images={ad.images} />
        ) : (
          <div className="flex aspect-[16/10] w-full items-center justify-center bg-black/5">
            <Car className="h-10 w-10 opacity-30" style={{ color: "var(--ink)" }} />
          </div>
        )}
        <span
          className="absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide"
          style={{ background: GOLD, color: "#241b05" }}
        >
          Featured
        </span>
        {ad.finance_available && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#15803d]">
            <CheckCircle className="h-3 w-3" /> Finance
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Title + Price */}
        <h3 className="text-lg font-extrabold leading-tight" style={{ color: "var(--ink)" }}>{ad.title}</h3>
        {ad.price && (
          <p className="mt-1 text-2xl font-extrabold" style={{ color: GOLD }}>R {ad.price.toLocaleString()}</p>
        )}

        {/* Description */}
        {descLines.length > 0 && (
          <div className="mt-2 whitespace-pre-line text-xs leading-relaxed" style={{ color: "var(--mut)" }}>
            {(expanded ? descLines : preview).join("\n")}
            {hasMore && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="mt-1 block text-xs font-bold"
                style={{ color: GOLD }}
              >
                {expanded ? "Show less ▲" : "Read more ▼"}
              </button>
            )}
          </div>
        )}

        {/* Video */}
        {ad.video_url && (
          <div className="mt-3">
            <VideoEmbed url={ad.video_url} />
          </div>
        )}

        {/* CTA */}
        <a href={`https://wa.me/${waNumber}?text=${waMsg}`} target="_blank" rel="noreferrer">
          <span
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#16a34a" }}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp About This Vehicle
          </span>
        </a>
      </div>
    </article>
  );
}

export default function AdvertFeed() {
  const { data: adverts = [], isLoading } = useQuery({
    queryKey: ["adverts-public"],
    queryFn: () => api.entities.Advert.filter({ is_published: true }, "-created_date", 50),
  });

  if (isLoading) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-amber-300" />
        </div>
      </section>
    );
  }

  if (adverts.length === 0) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
        <div className="rounded-[24px] border p-8 text-center" style={{ borderColor: CARD_BORDER, background: "var(--glass)" }}>
          <p className="mb-2 text-2xl">🚗</p>
          <p className="text-sm" style={{ color: "var(--mut)" }}>New featured vehicles coming soon — stay tuned!</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold sm:text-2xl" style={{ color: "var(--ink)" }}>Featured Cars</h2>
          <p className="mt-0.5 text-xs sm:text-sm" style={{ color: "var(--mut)" }}>Handpicked deals — chat to us directly</p>
        </div>
        <a
          href="https://www.koosandmike.co.za"
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-bold"
          style={{ color: GOLD }}
        >
          See all ↗
        </a>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible">
        {adverts.map(ad => <AdvertCard key={ad.id} ad={ad} />)}
      </div>
    </section>
  );
}
