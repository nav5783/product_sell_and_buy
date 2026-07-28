import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Navbar = () => {
  const { user, logoutUser, theme, toggleTheme, isAdmin } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⭐</span>
          <span className="brand-text">Portfolio<span className="brand-accent"> Naveen</span></span>
        </Link>

        <nav className="navbar-links">
          {user ? (
            <>
              {isAdmin ? (
                <Link to="/admin" className="nav-link admin-badge">
                  🛡️ Admin Panel
                </Link>
              ) : (
                <Link to="/dashboard" className="nav-link">
                  📊 Dashboard
                </Link>
              )}

              <Link to={`/portfolio/${user.username}`} target="_blank" className="nav-btn btn-outline">
                👁️ Public Link
              </Link>

              <div className="user-profile-badge">
                <div className="user-avatar-sm">
                  {user.fullName ? user.fullName[0].toUpperCase() : "U"}
                </div>
                <span className="user-name-text">{user.fullName || user.username}</span>
              </div>

              <button onClick={handleLogout} className="btn-logout-icon" title="Logout">
                🚪 Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-btn btn-primary">
                Get Started
              </Link>
            </>
          )}

          <button onClick={toggleTheme} className="theme-toggle-btn" title="Toggle Light/Dark Mode">
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
