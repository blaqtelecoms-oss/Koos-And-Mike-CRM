import { Link } from "react-router-dom";

export default function QuickTile({ to, icon, label }) {
  return (
    <Link to={to} className="km-tile">
      {icon}
      <span>{label}</span>
    </Link>
  );
}
