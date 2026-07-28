import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import { motion } from "framer-motion";

function Register() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
  });

  useEffect(() => {
    const pwd = form.password;
    if (!pwd) {
      setPasswordStrength({ score: 0, label: "", color: "" });
      return;
    }

    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    let label = "Weak";
    let color = "#ef4444";
    if (score >= 4) {
      label = "Strong";
      color = "#10b981";
    } else if (score >= 2) {
      label = "Medium";
      color = "#f59e0b";
    }

    setPasswordStrength({ score, label, color });
  }, [form.password]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName || !form.email || !form.username || !form.password || !form.confirmPassword) {
      addToast("Please fill in all fields.", "error");
      return;
    }

    if (form.password !== form.confirmPassword) {
      addToast("Passwords do not match.", "error");
      return;
    }

    if (form.password.length < 6) {
      addToast("Password must be at least 6 characters long.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await API.post("/auth/register", form);
      addToast(res.data.message || "Registration successful!", "success");
      if (res.data.user) {
        setUser(res.data.user);
      }
      navigate("/dashboard");
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
        className="auth-card auth-card-lg"
      >
        <div className="auth-header">
          <h2>Create an Account</h2>
          <p>Build your professional portfolio in minutes</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="e.g. Sarah Jenkins"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="e.g. sjenkins"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="sarah@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {passwordStrength.label && (
                <div className="password-strength-bar">
                  <div
                    className="strength-fill"
                    style={{
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  ></div>
                  <span className="strength-text" style={{ color: passwordStrength.color }}>
                    Strength: {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-submit"
          >
            {isLoading ? "Creating Account..." : "Register Now"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="auth-link-primary">
              Log In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Register;