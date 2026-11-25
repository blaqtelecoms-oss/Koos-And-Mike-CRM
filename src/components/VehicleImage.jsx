import { useState } from "react";
import { Car } from "lucide-react";

/**
 * Vehicle photo that falls back to a neutral placeholder when the file is
 * missing (many imported vehicles point at photos that no longer exist).
 */
export default function VehicleImage({ src, alt = "", className = "", style }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 ${className}`}
        style={{ background: "rgba(128,128,128,0.14)", color: "#8f8f8f", ...style }}
        aria-label={alt || "No photo available"}
      >
        <Car style={{ width: 26, height: 26, opacity: 0.7, strokeWidth: 1.6 }} />
        <span style={{ fontSize: 10, letterSpacing: ".5px" }}>NO PHOTO</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
