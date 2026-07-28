import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Sidebar = ({ mode = "user" }) => {
  const { user, logoutUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    addToast("Logged out successfully.", "info");
    navigate("/login");
  };

  const userNavItems = [
    { label: "Dashboard", path: "/dashboard", icon: "📊" },
    { label: "Profile & About", path: "/dashboard/profile", icon: "👤" },
    { label: "Skills", path: "/dashboard/skills", icon: "⚡" },
    { label: "Experience", path: "/dashboard/experience", icon: "💼" },
    { label: "Education", path: "/dashboard/education", icon: "🎓" },
    { label: "Projects", path: "/dashboard/projects", icon: "💻" },
    { label: "Achievements", path: "/dashboard/achievements", icon: "🏆" },
    { label: "Resume Upload", path: "/dashboard/resume", icon: "📄" },
    { label: "Social Links", path: "/dashboard/social-links", icon: "🌐" },
    { label: "Portfolio Theme", path: "/dashboard/theme", icon: "🎨" },
    { label: "Portfolio Preview", path: "/dashboard/preview", icon: "👁️" },
    { label: "Settings", path: "/dashboard/settings", icon: "⚙️" },
  ];

  const adminNavItems = [
    { label: "Admin Dashboard", path: "/admin", icon: "🛡️" },
    { label: "Manage Users", path: "/admin/users", icon: "👥" },
    { label: "Portfolio Templates", path: "/admin/templates", icon: "🎨" },
    { label: "System Messages", path: "/admin/messages", icon: "💬" },
    { label: "System Settings", path: "/admin/settings", icon: "⚙️" },
  ];

  const navItems = mode === "admin" ? adminNavItems : userNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-user-card">
          <div className="avatar-circle">
            {user?.fullName ? user.fullName[0].toUpperCase() : "U"}
          </div>
          <div className="user-info">
            <h4 className="user-name">{user?.fullName || user?.username}</h4>
            <span className="user-role-tag">{mode === "admin" ? "System Admin" : `@${user?.username}`}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/dashboard" || item.path === "/admin"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="link-icon">{item.icon}</span>
            <span className="link-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-btn">
          <span>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
