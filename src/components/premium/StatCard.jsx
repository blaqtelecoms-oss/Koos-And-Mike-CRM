export default function StatCard({ label, icon, value, trend, trendDir = "nu", highlight = false, footer = "This month" }) {
  return (
    <div className={`km-card km-stat ${highlight ? "highlight" : ""}`}>
      <div className="km-stat-header">
        <span>{label}</span>
        <span className="km-icon-btn">{icon}</span>
      </div>
      <span className="km-stat-number">{value}</span>
      <div className="km-stat-footer">
        <span>{footer}</span>
        {trend != null && (
          <span className={`km-tag km-tag-${trendDir}`}>{trend}</span>
        )}
      </div>
    </div>
  );
}
