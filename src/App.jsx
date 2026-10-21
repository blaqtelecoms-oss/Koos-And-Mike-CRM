import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ClientPortal from './pages/ClientPortal';
import ClientLogin from './pages/ClientLogin';
import ClientInventory from './pages/ClientInventory';
import ClientRegister from './pages/ClientRegister';
import ClientTradeIn from './pages/ClientTradeIn';
import ClientCarRequest from './pages/ClientCarRequest';
import Landing from './pages/Landing';
import StaffLanding from './pages/StaffLanding';
import MyLeads from './pages/MyLeads';
import AdminPerformance from './pages/AdminPerformance';
import SalesPortal from './pages/SalesPortal';
import CallCentrePortal from './pages/CallCentrePortal';
import CCLanding from './pages/CCLanding';
import Adverts from './pages/Adverts';
import InsuranceCallFlow from './pages/InsuranceCallFlow';

import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useEffect } from 'react';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

// Redirects authenticated users to the right portal based on role
const RoleBasedRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/Dashboard', { replace: true });
      } else {
        navigate('/MyLeads', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0D0D" }}>
      <div className="w-8 h-8 border-4 border-amber-800 border-t-amber-400 rounded-full animate-spin"></div>
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#0D0D0D" }}>
        <div className="w-8 h-8 border-4 border-amber-800 border-t-amber-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // auth_required — allow public routes to still render
    if (authError.type === 'auth_required') {
      const path = window.location.pathname;
      const publicPaths = ['/staff', '/MyLeads', '/ClientPortal', '/ClientLogin', '/ClientInventory', '/ClientRegister', '/ClientTradeIn', '/ClientCarRequest', '/SalesPortal', '/CallCentrePortal', '/AdminPerformance'];
      if (publicPaths.some(p => path.startsWith(p))) {
        // Fall through to render routes below
      } else {
        return <Routes>
          <Route path="*" element={<Landing />} />
        </Routes>;
      }
    }
  }

  // Render the main app
  return (
    <Routes>
      {/* Landing page — if already logged in, redirect to correct portal */}
      <Route path="/" element={
        isAuthenticated && user ? <RoleBasedRedirect /> : <Landing />
      } />

      {/* Admin / Sales pages — wrapped in layout */}
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}

      {/* Client Portal — no admin layout */}
      <Route path="/ClientLogin" element={<ClientLogin />} />
      <Route path="/ClientPortal" element={<ClientPortal />} />
      <Route path="/ClientInventory" element={<ClientInventory />} />
      <Route path="/ClientRegister" element={<ClientRegister />} />
      <Route path="/ClientTradeIn" element={<ClientTradeIn />} />
      <Route path="/ClientCarRequest" element={<ClientCarRequest />} />

      <Route path="/Adverts" element={<LayoutWrapper currentPageName="Adverts"><Adverts /></LayoutWrapper>} />
      <Route path="/staff" element={<StaffLanding />} />
      <Route path="/MyLeads" element={<MyLeads />} />
      <Route path="/AdminPerformance" element={<AdminPerformance />} />
      <Route path="/SalesPortal" element={<SalesPortal />} />
      <Route path="/CallCentrePortal" element={<CallCentrePortal />} />
      <Route path="/CCLanding" element={<CCLanding />} />
      <Route path="/InsuranceCallFlow" element={<InsuranceCallFlow />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App