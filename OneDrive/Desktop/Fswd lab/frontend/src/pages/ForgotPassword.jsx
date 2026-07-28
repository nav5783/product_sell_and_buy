import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import { motion } from "framer-motion";

function ForgotPassword() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.newPassword || !form.confirmPassword) {
      addToast("Please fill in all fields.", "error");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }

    if (form.newPassword.length < 6) {
      addToast("Password must be at least 6 characters long.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/auth/forgot-password", form);
      addToast(res.data.message || "Password updated successfully!", "success");
      navigate("/login");
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="auth-card"
      >
        <div className="auth-header">
          <h2>Reset Password</h2>
          <p>Enter your registered email and new password directly</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Registered Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="e.g. sarah@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Minimum 6 characters"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter new password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-submit"
          >
            {isLoading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Remembered your password?{" "}
            <Link to="/login" className="auth-link-primary">
              Back to Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;