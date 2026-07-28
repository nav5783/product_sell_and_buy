import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitPassword = async (e) => {
    e.preventDefault();

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      addToast("Please fill in all password fields.", "error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      addToast("New passwords do not match.", "error");
      return;
    }

    if (form.newPassword.length < 6) {
      addToast("New password must be at least 6 characters long.", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await API.put("/user/settings/change-password", form);
      addToast(res.data.message || "Password changed successfully!", "success");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>⚙️ Account Settings</h2>
        <p>Update your password, session security, and account preferences.</p>
      </div>

      <div className="card card-form">
        <h3>🔒 Security & Password Change</h3>
        <p className="card-subtext">Passwords are securely hashed using bcrypt.</p>

        <form onSubmit={handleSubmitPassword} className="form-stack">
          <div className="form-group">
            <label>Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Updating Password..." : "🔑 Update Password"}
            </button>
          </div>
        </form>
      </div>

      <div className="card card-info-box">
        <h3>👤 Account Details</h3>
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Account Role:</strong> {user?.role?.toUpperCase()}</p>
        <p><strong>Authentication Mode:</strong> Express Session (Cookie Based)</p>
      </div>
    </div>
  );
}

export default Settings;
