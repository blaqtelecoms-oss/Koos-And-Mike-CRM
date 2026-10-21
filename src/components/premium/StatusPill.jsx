const STATUS_COLORS = {
  "New":          "#ff9d00",
  "Contacted":    "#ff9d00",
  "Test Drive":   "#a855f7",
  "Approved":     "#22c55e",
  "Sold":         "#22c55e",
  "No Answer":    "#6b7280",
  "Lost":         "#ef4444",
  "Available":    "#22c55e",
  "Reserved":     "#ff9d00",
  "Pending Review": "#ff9d00",
  "Reviewed":     "#ff9d00",
  "Accepted":     "#22c55e",
  "Declined":     "#ef4444",
  "Searching":    "#ff9d00",
  "Found":        "#22c55e",
  "Closed":       "#6b7280",
  "Published":    "#22c55e",
  "Draft":        "#6b7280",
};

export default function StatusPill({ status }) {
  const c = STATUS_COLORS[status] || "#8a8a8a";
  return (
    <span
      className="km-status"
      style={{
        "--c": c,
        background: `color-mix(in srgb, ${c} 18%, transparent)`,
        color: c,
      }}
    >
      {status}
    </span>
  );
}
