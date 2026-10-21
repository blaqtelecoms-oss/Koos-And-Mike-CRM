export default function PipelineRing({ total, filled }) {
  const ticks = 60;
  const filledCount = total > 0 ? Math.round((filled / total) * ticks) : 0;
  const tickEls = Array.from({ length: ticks }, (_, i) => {
    const isFilled = i < filledCount;
    return (
      <rect
        key={i}
        x="98"
        y="6"
        width="4.5"
        height="26"
        rx="2.2"
        transform={`rotate(${i * 6} 100 100)`}
        fill={isFilled ? "url(#km-yg)" : "currentColor"}
        opacity={isFilled ? 1 : 0.1}
      />
    );
  });

  return (
    <svg viewBox="0 0 200 200" width="100%">
      <defs>
        <linearGradient id="km-yg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd54f" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      {tickEls}
      <text x="100" y="94" textAnchor="middle" fontSize="11" fill="var(--mut)">Total</text>
      <text x="100" y="124" textAnchor="middle" fontSize="34" fontWeight="600" fill="currentColor">{total}</text>
    </svg>
  );
}
