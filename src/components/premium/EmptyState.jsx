export default function EmptyState({ icon, message, actionLabel, onAction }) {
  return (
    <div className="km-card km-empty">
      <div className="km-icon-btn">{icon}</div>
      {message}
      {actionLabel && (
        <div style={{ marginTop: 12 }}>
          <button className="km-btn-primary" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
