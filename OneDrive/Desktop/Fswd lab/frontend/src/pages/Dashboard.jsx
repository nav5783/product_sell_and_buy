import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/user/dashboard");
      setData(res.data);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const publicPortfolioUrl = `${window.location.origin}/portfolio/${user?.username}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicPortfolioUrl);
    setCopied(true);
    addToast("Public portfolio URL copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return <LoadingSpinner text="Loading dashboard statistics..." />;
  }

  const { profile, stats } = data || {};

  // Calculate profile completeness score
  let score = 0;
  if (profile?.fullName) score += 15;
  if (profile?.headline) score += 15;
  if (profile?.bio) score += 15;
  if (profile?.profilePhoto) score += 15;
  if (stats?.projectsCount > 0) score += 15;
  if (stats?.skillsCount > 0) score += 15;
  if (profile?.resumeUrl) score += 10;

  return (
    <div className="dashboard-content">
      <div className="dashboard-header-banner">
        <div className="banner-left">
          <h2>Welcome back, <span className="highlight-text">{user?.fullName || user?.username}</span> 👋</h2>
          <p>Manage your portfolio items, customize your theme, and monitor your visitor metrics.</p>
        </div>
        <div className="banner-actions">
          <button onClick={handleCopyUrl} className="btn-action btn-outline">
            {copied ? "✓ Copied!" : "📋 Copy Portfolio URL"}
          </button>
          <Link to={`/portfolio/${user?.username}`} target="_blank" className="btn-action btn-primary">
            👁️ Public Portfolio
          </Link>
        </div>
      </div>

      {/* Completion Progress Bar */}
      <div className="card progress-card">
        <div className="progress-header">
          <span className="progress-title">Portfolio Completion</span>
          <span className="progress-percent">{score}%</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${score}%` }}></div>
        </div>
        <p className="progress-subtext">
          {score < 100 ? "Add your projects, skills, and resume to reach 100% completion." : "🎉 Great job! Your portfolio is 100% complete and ready for showcase!"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <div className="stat-icon icon-purple">💻</div>
          <div className="stat-details">
            <h3>{stats?.projectsCount || 0}</h3>
            <p>Projects Added</p>
          </div>
          <Link to="/dashboard/projects" className="stat-link">Manage →</Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <div className="stat-icon icon-blue">⚡</div>
          <div className="stat-details">
            <h3>{stats?.skillsCount || 0}</h3>
            <p>Skills Listed</p>
          </div>
          <Link to="/dashboard/skills" className="stat-link">Manage →</Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <div className="stat-icon icon-green">💼</div>
          <div className="stat-details">
            <h3>{stats?.expCount || 0}</h3>
            <p>Work Experience</p>
          </div>
          <Link to="/dashboard/experience" className="stat-link">Manage →</Link>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="stat-card">
          <div className="stat-icon icon-amber">🏆</div>
          <div className="stat-details">
            <h3>{stats?.achCount || 0}</h3>
            <p>Achievements</p>
          </div>
          <Link to="/dashboard/achievements" className="stat-link">Manage →</Link>
        </motion.div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="quick-grid">
        <div className="card quick-card">
          <h3>👤 Profile & Social Links</h3>
          <p>Update your headline, bio, contact details, and external platform handles.</p>
          <div className="quick-card-buttons">
            <Link to="/dashboard/profile" className="btn-sm btn-outline">Edit Profile</Link>
            <Link to="/dashboard/social-links" className="btn-sm btn-outline">Social Links</Link>
          </div>
        </div>

        <div className="card quick-card">
          <h3>🎨 Active Theme</h3>
          <p>Current Theme: <strong>{user?.activeTemplate?.toUpperCase() || "MODERN"}</strong></p>
          <div className="quick-card-buttons">
            <Link to="/dashboard/theme" className="btn-sm btn-primary">Change Theme</Link>
            <Link to="/dashboard/preview" className="btn-sm btn-outline">Preview Portfolio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
