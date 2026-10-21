import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  CheckSquare, 
  Share2, 
  Menu,
  X,
  LogOut,
  RefreshCw,
  Search,
  ExternalLink,
  BarChart2,
  Phone,
  ChevronLeft,
  Megaphone
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import BottomTabBar from "@/components/BottomTabBar";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

const TOP_LEVEL_PAGES = ["Dashboard", "Leads", "Vehicles", "Tasks", "SocialPosts", "TradeIns", "CarRequests"];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isChildRoute = !TOP_LEVEL_PAGES.includes(currentPageName);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const navigation = [
    { name: "Dashboard", page: "Dashboard", icon: LayoutDashboard },
    { name: "Leads", page: "Leads", icon: Users },
    { name: "Vehicles", page: "Vehicles", icon: Car },
    { name: "Daily Tasks", page: "Tasks", icon: CheckSquare },
    { name: "Social Posts", page: "SocialPosts", icon: Share2 },
    { name: "Adverts", page: "Adverts", icon: Megaphone },
  ];

  const clientNav = [
    { name: "Trade-In Reviews", page: "TradeIns", icon: RefreshCw },
    { name: "Car Requests", page: "CarRequests", icon: Search },
  ];

  const adminNav = [
    { name: "Performance Monitor", path: "/AdminPerformance", icon: BarChart2 },
    { name: "Sales Portals", path: "/SalesPortal", icon: Users },
    { name: "Call Centre Portal", path: "/CCLanding", icon: Phone },
  ];

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D0D0D" }}>
      {/* Mobile header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 bg-black border-b border-amber-700/40"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <button
          onClick={() => isChildRoute ? navigate(-1) : setSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isChildRoute
            ? <ChevronLeft className="w-6 h-6 text-amber-400" />
            : <Menu className="w-6 h-6 text-amber-400" />
          }
        </button>
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png" alt="Koos & Mike Cars" className="h-10 w-10 object-contain rounded-lg" />
          <span className="font-bold text-amber-400">Koos & Mike CRM</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/70 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-black border-r border-amber-700/30 z-50
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-24 flex items-center justify-between px-6 border-b border-amber-700/30">
            <div className="flex items-center gap-3">
              <img 
                src="https://media.base44.com/images/public/69ba4650f213ea0fa82b95fb/fab77c211_KMLogo.png" 
                alt="Koos & Mike Cars" 
                className="w-12 h-12 object-contain rounded-xl"
              />
              <div>
                <h1 className="font-bold text-amber-400 text-base leading-tight">Koos & Mike Cars</h1>
                <p className="text-xs text-amber-600/70">Lead Management</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-5 h-5 text-amber-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-amber-600 text-black shadow-lg shadow-amber-600/25' 
                      : 'text-amber-200/70 hover:bg-white/5 hover:text-amber-300'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-amber-500/60'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            <p className="text-xs font-semibold text-amber-700/60 uppercase tracking-wider px-4 pt-4 pb-1">Client Submissions</p>
            {clientNav.map((item) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-amber-700 text-white shadow-lg shadow-amber-700/25' 
                      : 'text-amber-200/70 hover:bg-white/5 hover:text-amber-300'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-amber-500/60'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}

            {user?.role === "admin" && (
              <>
                <p className="text-xs font-semibold text-amber-700/60 uppercase tracking-wider px-4 pt-4 pb-1">Admin Only</p>
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.path} href={item.path} onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-amber-200/70 hover:bg-white/5 hover:text-amber-300">
                      <Icon className="w-5 h-5 text-amber-500/60" />
                      <span className="font-medium">{item.name}</span>
                    </a>
                  );
                })}
              </>
            )}

            <div className="px-4 pt-4">
              <a href="/ClientPortal" target="_blank" rel="noreferrer">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-600/10 border border-amber-600/30 hover:bg-amber-600/20 transition-all cursor-pointer">
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-amber-400 text-sm">Open Client Portal</span>
                </div>
              </a>
            </div>
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-amber-700/30 space-y-2">
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-amber-700 rounded-full flex items-center justify-center">
                  <span className="text-black font-semibold text-sm">
                    {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-amber-300 truncate text-sm">
                    {user.full_name || 'User'}
                  </p>
                  <p className="text-xs text-amber-600/60 truncate">{user.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={handleLogout}
                  className="text-amber-600/60 hover:text-amber-400"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
              <DeleteAccountDialog />
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main
        className="lg:pl-72 lg:pt-0 min-h-screen"
        style={{ paddingTop: "calc(3.5rem + env(safe-area-inset-top))" }}
      >
        <div
          data-page-content
          className="p-4 lg:p-8 lg:pt-8 lg:pb-8"
          style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          key={location.pathname}
        >
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <BottomTabBar />
    </div>
  );
}