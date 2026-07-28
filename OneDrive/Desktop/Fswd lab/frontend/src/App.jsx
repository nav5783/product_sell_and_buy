import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";

// Components
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// User Dashboard Pages
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Projects from "./pages/Projects";
import Skills from "./pages/Skills";
import Experience from "./pages/Experience";
import Education from "./pages/Education";
import Achievements from "./pages/Achievements";
import SocialLinks from "./pages/SocialLinks";
import Resume from "./pages/Resume";
import PortfolioTheme from "./pages/PortfolioTheme";
import PortfolioPreview from "./pages/PortfolioPreview";
import Settings from "./pages/Settings";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";

// Public Portfolio View Page
import PortfolioView from "./pages/PortfolioView";

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const isPublicPortfolio = location.pathname.startsWith("/portfolio/");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isPublicPortfolio) {
    return (
      <Routes>
        <Route path="/portfolio/:username" element={<PortfolioView />} />
      </Routes>
    );
  }

  return (
    <div className="app-root">
      <Navbar />
      <div className="app-body">
        {user && isDashboardRoute && <Sidebar mode="user" />}
        {user && isAdminRoute && <Sidebar mode="admin" />}
        <main className={`main-content ${(isDashboardRoute || isAdminRoute) && user ? "with-sidebar" : ""}`}>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/" element={<Navigate to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"} replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* User Dashboard Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/profile" element={<Profile />} />
              <Route path="/dashboard/projects" element={<Projects />} />
              <Route path="/dashboard/skills" element={<Skills />} />
              <Route path="/dashboard/experience" element={<Experience />} />
              <Route path="/dashboard/education" element={<Education />} />
              <Route path="/dashboard/achievements" element={<Achievements />} />
              <Route path="/dashboard/social-links" element={<SocialLinks />} />
              <Route path="/dashboard/resume" element={<Resume />} />
              <Route path="/dashboard/theme" element={<PortfolioTheme />} />
              <Route path="/dashboard/preview" element={<PortfolioPreview />} />
              <Route path="/dashboard/settings" element={<Settings />} />
            </Route>

            {/* Admin Dashboard Protected Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/admin" element={<AdminDashboard tab="stats" />} />
              <Route path="/admin/users" element={<AdminDashboard tab="users" />} />
              <Route path="/admin/templates" element={<AdminDashboard tab="templates" />} />
              <Route path="/admin/messages" element={<AdminDashboard tab="messages" />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      {!isDashboardRoute && !isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
