export default function Avatar({ name = "?", size }) {
  const initials = name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="km-avatar"
      style={size ? { width: size, height: size, fontSize: size * 0.4 } : undefined}
    >
      {initials || name.charAt(0).toUpperCase()}
    </span>
  );
}
