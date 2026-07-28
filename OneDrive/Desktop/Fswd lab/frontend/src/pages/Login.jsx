import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { motion } from "framer-motion";

function Login() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    login: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.login.trim() || !form.password.trim()) {
      addToast("Please enter email/username and password.", "error");
      return;
    }

    try {
      setIsLoading(true);
      const res = await loginUser(form);
      addToast(res.message || "Welcome back!", "success");
      
      if (res.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
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
          <h2>Welcome Back</h2>
          <p>Log in to manage your portfolio, stats, and profile</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login">Email or Username</label>
            <input
              type="text"
              id="login"
              name="login"
              value={form.login}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-with-link">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="auth-link-sm">
                Forgot Password?
              </Link>
            </div>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-submit"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="auth-demo-hint">
          <p className="hint-title">⚡ Default Admin Credentials:</p>
          <p>Username: <code>admin</code> | Password: <code>admin123</code></p>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="auth-link-primary">
              Register Now
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;