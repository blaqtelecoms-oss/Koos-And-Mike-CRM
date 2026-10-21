import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Car, CheckSquare } from "lucide-react";

const tabs = [
  { label: "Dashboard", path: "/Dashboard", icon: LayoutDashboard },
  { label: "Leads", path: "/Leads", icon: Users },
  { label: "Vehicles", path: "/Vehicles", icon: Car },
  { label: "Tasks", path: "/Tasks", icon: CheckSquare },
];

export default function BottomTabBar() {
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        background: "#000000f0",
        borderColor: "#C9A84C22",
        backdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + "/");
          return (
            <Link
              key={path}
              to={path}
              className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              style={{ color: isActive ? "#C9A84C" : "#ffffff44" }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}