export default function PrimaryButton({ children, onClick, type = "button", className = "", ...props }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`km-btn-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
