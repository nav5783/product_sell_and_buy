import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function AdminDashboard({ tab = "stats" }) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState(tab);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [showTplModal, setShowTplModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [tplForm, setTplForm] = useState({
    name: "",
    themeKey: "",
    description: "",
    bgColor: "#0f172a",
    cardBg: "#1e293b",
    primaryColor: "#6366f1",
    textColor: "#f8fafc",
    isActive: true,
    isDefault: false,
  });
  const [previewFile, setPreviewFile] = useState(null);
  const [bgImageFile, setBgImageFile] = useState(null);

  // Messages State
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setActiveTab(tab);
  }, [tab]);

  // Load Admin Data based on active tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (activeTab === "stats" || activeTab === "overview") {
          const res = await API.get("/admin/stats");
          setStats(res.data.stats);
        } else if (activeTab === "users") {
          const res = await API.get(`/admin/users?search=${encodeURIComponent(search)}&page=${page}`);
          setUsers(res.data.users);
          setTotalPages(res.data.totalPages);
        } else if (activeTab === "templates") {
          const res = await API.get("/admin/templates");
          setTemplates(res.data);
        } else if (activeTab === "messages") {
          const res = await API.get("/admin/messages");
          setMessages(res.data);
        }
      } catch (err) {
        addToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, search, page]);

  // User Actions
  const handleToggleUserActive = async (userId) => {
    try {
      const res = await API.patch(`/admin/users/${userId}/toggle-active`);
      addToast(res.data.message, "success");
      setUsers(users.map((u) => (u._id === userId ? res.data.user : u)));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure? This will delete the user and all their portfolio data!")) return;
    try {
      const res = await API.delete(`/admin/users/${userId}`);
      addToast(res.data.message, "success");
      setUsers(users.filter((u) => u._id !== userId));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Template Actions
  const openCreateTplModal = () => {
    setEditingTpl(null);
    setTplForm({
      name: "",
      themeKey: "",
      description: "",
      bgColor: "#0f172a",
      cardBg: "#1e293b",
      primaryColor: "#6366f1",
      textColor: "#f8fafc",
      isActive: true,
      isDefault: false,
    });
    setPreviewFile(null);
    setBgImageFile(null);
    setShowTplModal(true);
  };

  const openEditTplModal = (tpl) => {
    setEditingTpl(tpl);
    setTplForm({
      name: tpl.name || "",
      themeKey: tpl.themeKey || "",
      description: tpl.description || "",
      bgColor: tpl.bgColor || "#0f172a",
      cardBg: tpl.cardBg || "#1e293b",
      primaryColor: tpl.primaryColor || "#6366f1",
      textColor: tpl.textColor || "#f8fafc",
      isActive: tpl.isActive !== undefined ? tpl.isActive : true,
      isDefault: tpl.isDefault || false,
    });
    setPreviewFile(null);
    setBgImageFile(null);
    setShowTplModal(true);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!tplForm.name.trim() || !tplForm.themeKey.trim()) {
      addToast("Name and Theme Key are required.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("name", tplForm.name);
    formData.append("themeKey", tplForm.themeKey);
    formData.append("description", tplForm.description);
    formData.append("bgColor", tplForm.bgColor);
    formData.append("cardBg", tplForm.cardBg);
    formData.append("primaryColor", tplForm.primaryColor);
    formData.append("textColor", tplForm.textColor);
    formData.append("isActive", tplForm.isActive);
    formData.append("isDefault", tplForm.isDefault);

    if (previewFile) formData.append("previewImage", previewFile);
    if (bgImageFile) formData.append("bgImage", bgImageFile);

    try {
      setSubmitting(true);
      if (editingTpl) {
        const res = await API.put(`/admin/templates/${editingTpl._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast(res.data.message, "success");
        setTemplates(templates.map((t) => (t._id === editingTpl._id ? res.data.template : t)));
      } else {
        const res = await API.post("/admin/templates", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        addToast(res.data.message, "success");
        setTemplates([res.data.template, ...templates]);
      }
      setShowTplModal(false);
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (tplId) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    try {
      await API.delete(`/admin/templates/${tplId}`);
      addToast("Template deleted.", "success");
      setTemplates(templates.filter((t) => t._id !== tplId));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  // Message Actions
  const handleDeleteMessage = async (msgId) => {
    try {
      await API.delete(`/admin/messages/${msgId}`);
      addToast("Message deleted.", "success");
      setMessages(messages.filter((m) => m._id !== msgId));
    } catch (err) {
      addToast(err.message, "error");
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h2>🛡️ Admin Control Panel</h2>
          <p>System metrics, user accounts management, template catalog, and platform communications.</p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="admin-tabs">
          <button
            onClick={() => setActiveTab("stats")}
            className={`tab-btn ${activeTab === "stats" ? "active" : ""}`}
          >
            📊 Statistics
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
          >
            👥 Users
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`tab-btn ${activeTab === "templates" ? "active" : ""}`}
          >
            🎨 Templates
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`tab-btn ${activeTab === "messages" ? "active" : ""}`}
          >
            💬 Messages
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading admin control panel..." />
      ) : (
        <>
          {/* STATS OVERVIEW TAB */}
          {(activeTab === "stats" || activeTab === "overview") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon icon-purple">👥</div>
                  <div className="stat-details">
                    <h3>{stats?.totalUsers || 0}</h3>
                    <p>Total Registered Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon icon-blue">💻</div>
                  <div className="stat-details">
                    <h3>{stats?.totalProjects || 0}</h3>
                    <p>User Projects</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon icon-green">🎨</div>
                  <div className="stat-details">
                    <h3>{stats?.activeTemplates || 0} / {stats?.totalTemplates || 0}</h3>
                    <p>Active Templates</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon icon-amber">💬</div>
                  <div className="stat-details">
                    <h3>{stats?.totalMessages || 0}</h3>
                    <p>System Messages</p>
                  </div>
                </div>
              </div>

              <div className="card admin-quick-actions">
                <h3>🚀 Admin Quick Actions</h3>
                <div className="quick-action-buttons">
                  <button onClick={() => setActiveTab("users")} className="btn-primary">
                    Manage User Accounts
                  </button>
                  <button onClick={() => setActiveTab("templates")} className="btn-outline">
                    Manage Portfolio Templates
                  </button>
                  <button onClick={() => setActiveTab("messages")} className="btn-outline">
                    View Platform Messages
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* USERS MANAGEMENT TAB */}
          {activeTab === "users" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <div className="table-toolbar flex-between">
                <input
                  type="text"
                  placeholder="🔍 Search users by name, username, or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="search-input"
                />
                <span className="count-text">Found Users: {users.length}</span>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center">No users found.</td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <strong>{u.fullName}</strong>
                          </td>
                          <td><code>@{u.username}</code></td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`role-badge role-${u.role}`}>{u.role}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${u.isActive ? "active" : "inactive"}`}>
                              {u.isActive ? "Active" : "Deactivated"}
                            </span>
                          </td>
                          <td className="table-actions">
                            <Link
                              to={`/portfolio/${u.username}`}
                              target="_blank"
                              className="btn-icon btn-view"
                              title="View User Portfolio"
                            >
                              👁️ Portfolio
                            </Link>

                            <button
                              onClick={() => handleToggleUserActive(u._id)}
                              className={`btn-icon ${u.isActive ? "btn-warning" : "btn-success"}`}
                              title={u.isActive ? "Deactivate User" : "Activate User"}
                            >
                              {u.isActive ? "🚫 Deactivate" : "✅ Activate"}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="btn-icon btn-delete"
                              title="Delete User"
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-sm btn-outline"
                  >
                    ← Previous
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn-sm btn-outline"
                  >
                    Next →
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* TEMPLATES MANAGEMENT TAB */}
          {activeTab === "templates" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex-between mb-4">
                <h3>🎨 Portfolio Templates Catalog</h3>
                <button onClick={openCreateTplModal} className="btn-primary">
                  ➕ Create New Template
                </button>
              </div>

              <div className="grid-3">
                {templates.map((tpl) => (
                  <div key={tpl._id} className="card template-admin-card">
                    <div
                      className="tpl-preview-banner"
                      style={{
                        backgroundColor: tpl.bgColor || "#0f172a",
                        backgroundImage: tpl.bgImage ? `url(http://localhost:5000${tpl.bgImage})` : "none",
                        backgroundSize: "cover",
                        padding: "1rem",
                        borderRadius: "8px",
                        marginBottom: "0.85rem",
                        border: `1px solid ${tpl.primaryColor || "#6366f1"}`
                      }}
                    >
                      <h4 style={{ color: tpl.primaryColor || "#6366f1" }}>{tpl.name}</h4>
                      <span className={`status-badge ${tpl.isActive ? "active" : "inactive"}`}>
                        {tpl.isActive ? "Active" : "Disabled"}
                      </span>
                    </div>

                    <p className="tpl-key">Theme Key: <code>{tpl.themeKey}</code></p>
                    <p className="tpl-desc">{tpl.description}</p>
                    <div className="tpl-colors-preview">
                      <span style={{ backgroundColor: tpl.bgColor || "#0f172a" }} title="Background Color"></span>
                      <span style={{ backgroundColor: tpl.cardBg || "#1e293b" }} title="Card Color"></span>
                      <span style={{ backgroundColor: tpl.primaryColor || "#6366f1" }} title="Primary Accent"></span>
                    </div>

                    <div className="card-actions flex-between mt-3">
                      <button onClick={() => openEditTplModal(tpl)} className="btn-icon btn-edit">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDeleteTemplate(tpl._id)} className="btn-icon btn-delete">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {showTplModal && (
                <div className="modal-backdrop">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h3>{editingTpl ? "Edit Template" : "Create New Template"}</h3>
                      <button onClick={() => setShowTplModal(false)} className="modal-close">&times;</button>
                    </div>
                    <form onSubmit={handleSaveTemplate} className="modal-form">
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Template Name *</label>
                          <input
                            type="text"
                            value={tplForm.name}
                            onChange={(e) => setTplForm({ ...tplForm, name: e.target.value })}
                            placeholder="e.g. Glassmorphism Cyber"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Theme Key (Unique) *</label>
                          <input
                            type="text"
                            value={tplForm.themeKey}
                            onChange={(e) => setTplForm({ ...tplForm, themeKey: e.target.value })}
                            placeholder="e.g. glassmorphism-cyber"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          rows={2}
                          value={tplForm.description}
                          onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })}
                          placeholder="Describe the design style and palette..."
                        />
                      </div>

                      {/* Colors Customization in Template Creator */}
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Page Background Color</label>
                          <input
                            type="color"
                            value={tplForm.bgColor}
                            onChange={(e) => setTplForm({ ...tplForm, bgColor: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Card Background Color</label>
                          <input
                            type="color"
                            value={tplForm.cardBg}
                            onChange={(e) => setTplForm({ ...tplForm, cardBg: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label>Primary Accent Color</label>
                          <input
                            type="color"
                            value={tplForm.primaryColor}
                            onChange={(e) => setTplForm({ ...tplForm, primaryColor: e.target.value })}
                          />
                        </div>

                        <div className="form-group">
                          <label>Text Color</label>
                          <input
                            type="color"
                            value={tplForm.textColor}
                            onChange={(e) => setTplForm({ ...tplForm, textColor: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Background Image Upload */}
                      <div className="form-group">
                        <label>Template Background Image (Optional Upload)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBgImageFile(e.target.files[0])}
                        />
                      </div>

                      <div className="form-grid-2">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={tplForm.isActive}
                            onChange={(e) => setTplForm({ ...tplForm, isActive: e.target.checked })}
                          />
                          Template Active / Available to Users
                        </label>

                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={tplForm.isDefault}
                            onChange={(e) => setTplForm({ ...tplForm, isDefault: e.target.checked })}
                          />
                          Set as Default System Template
                        </label>
                      </div>

                      <div className="modal-actions">
                        <button type="button" onClick={() => setShowTplModal(false)} className="btn-secondary">
                          Cancel
                        </button>
                        <button type="submit" disabled={submitting} className="btn-primary">
                          {submitting ? "Saving..." : editingTpl ? "Update Template" : "Create Template"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === "messages" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
              <h3>💬 System Visitor Messages</h3>
              <div className="messages-list">
                {messages.length === 0 ? (
                  <p className="empty-state">No messages received yet.</p>
                ) : (
                  messages.map((msg) => (
                    <div key={msg._id} className="card message-item">
                      <div className="msg-header flex-between">
                        <div>
                          <strong>{msg.senderName}</strong> (<code>{msg.senderEmail}</code>)
                          <p className="msg-recipient">Target User: {msg.recipientUserId?.fullName || "General Admin"}</p>
                        </div>
                        <button onClick={() => handleDeleteMessage(msg._id)} className="btn-icon btn-delete">
                          🗑️ Delete
                        </button>
                      </div>
                      <h4 className="msg-subject">{msg.subject || "No Subject"}</h4>
                      <p className="msg-body">{msg.message}</p>
                      <span className="msg-date">{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
