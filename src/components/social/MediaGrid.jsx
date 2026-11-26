import { X } from "lucide-react";
import { isVideoUrl } from "./meta";

// Facebook-style media block: one image is a wide hero, more become a tile grid.
export default function MediaGrid({ media = [], onRemove }) {
  if (!media.length) return null;
  const shown = media.slice(0, 4);
  const layout = media.length === 1 ? "one" : media.length === 2 ? "two" : "many";

  return (
    <div className={`sp-media-grid ${layout}`}>
      {shown.map((url, index) => (
        <div key={`${url}-${index}`} className={`sp-media ${media.length === 1 ? "one" : ""} ${isVideoUrl(url) ? "sp-media-video" : ""}`}>
          {isVideoUrl(url) ? (
            <video src={url} muted playsInline controls={!onRemove} />
          ) : (
            <img src={url} alt="" loading="lazy" />
          )}
          {onRemove && (
            <button type="button" className="sp-media-x" onClick={() => onRemove(index)} aria-label="Remove media">
              <X style={{ width: 13, height: 13 }} />
            </button>
          )}
          {!onRemove && media.length > 4 && index === 3 && (
            <div className="sp-media-more">+{media.length - 4}</div>
          )}
        </div>
      ))}
    </div>
  );
}
