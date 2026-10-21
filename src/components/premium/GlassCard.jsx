export default function GlassCard({ children, className = "", tight = false, ...props }) {
  return (
    <div className={`km-card ${tight ? "km-card-tight" : ""} ${className}`} {...props}>
      {children}
    </div>
  );
}
