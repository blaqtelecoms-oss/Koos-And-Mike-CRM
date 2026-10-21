const STATUS_COLORS = {
  "New":          "#3b82f6",
  "Contacted":    "#e0a800",
  "Test Drive":   "#a855f7",
  "Approved":     "#16833a",
  "Sold":         "#16833a",
  "No Answer":    "#8a8a8a",
  "Lost":         "#e5484d",
  "Available":    "#16833a",
  "Reserved":     "#e0a800",
  "Pending Review": "#e0a800",
  "Reviewed":     "#3b82f6",
  "Accepted":     "#16833a",
  "Declined":     "#e5484d",
  "Searching":    "#e0a800",
  "Found":        "#16833a",
  "Closed":       "#8a8a8a",
  "Published":    "#16833a",
  "Draft":        "#8a8a8a",
};

export default function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || "#8a8a8a";
  return (
    <span
      className="km-status"
      style={{
        "--c": c,
        background: `color-mix(in srgb, ${c} 15%, transparent)`,
        color: `color-mix(in srgb, ${c} 75%, var(--ink))`,
      }}
    >
      {status}
    </span>
  );
}
