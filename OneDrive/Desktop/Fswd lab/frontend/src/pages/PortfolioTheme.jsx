import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import API from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

function PortfolioTheme() {
  const { user, setUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminTemplates, setAdminTemplates] = useState([]);

  const [activeTheme, setActiveTheme] = useState(user?.activeTemplate || "modern");
  const [colors, setColors] = useState({
    themePrimary: user?.themePrimary || "#6366f1",
    themeBg: user?.themeBg || "#090d16",
    themeCardBg: user?.themeCardBg || "#111827",
    themeText: user?.themeText || "#f8fafc",
  });

  const defaultPresetTemplates = [
    {
      key: "modern",
      name: "Modern Dark",
      badge: "Popular",
      description: "Sleek dark theme featuring glowing neon highlights, glassmorphism cards, and fluid smooth scroll.",
      primary: "#6366f1",
      bg: "#090d16",
      cardBg: "#111827",
      text: "#f8fafc"
    },
    {
      key: "minimal",
      name: "Minimalist Light",
      badge: "Clean",
      description: "Crisp white canvas, high contrast typography, minimal borders, and elegant grid spacing.",
      primary: "#2563eb",
      bg: "#ffffff",
      cardBg: "#f8fafc",
      text: "#0f172a"
    },
    {
      key: "cyberpunk",
      name: "Cyberpunk Neon",
      badge: "Futuristic",
      description: "Deep void canvas with electric cyan & magenta glowing accents, matrix tech grid accents.",
      primary: "#06b6d4",
      bg: "#050b14",
      cardBg: "#0b1329",
      text: "#38bdf8"
    },
    {
      key: "gradient",
      name: "Gradient Wave",
      badge: "Vibrant",
      description: "Rich multi-color gradient header banners, smooth backdrop filters, and vibrant skill meters.",
      primary: "#ec4899",
      bg: "#0f172a",
      cardBg: "#1e293b",
      text: "#f8fafc"
    },
    {
      key: "emerald",
      name: "Emerald Forest",
      badge: "Fresh",
      description: "Organic emerald greens, mint accents, dark forest backdrop for modern tech portfolios.",
      primary: "#10b981",
      bg: "#064e3b",
      cardBg: "#022c22",
      text: "#ecfdf5"
    },
    {
      key: "sunset",
      name: "Sunset Glow",
      badge: "Warm",
      description: "Warm amber & orange gradients, twilight purple canvas, smooth card reflections.",
      primary: "#f97316",
      bg: "#1c1917",
      cardBg: "#292524",
      text: "#fafaf9"
    }
  ];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await API.get("/user/templates");
        if (Array.isArray(res.data)) {
          setAdminTemplates(res.data);
        }
      } catch (err) {
        console.warn("Failed to fetch admin templates:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    setActiveTheme(user?.activeTemplate || "modern");
    setColors({
      themePrimary: user?.themePrimary || "#6366f1",
      themeBg: user?.themeBg || "#090d16",
      themeCardBg: user?.themeCardBg || "#111827",
      themeText: user?.themeText || "#f8fafc",
    });
  }, [user]);

  // Combine default preset templates + Admin created templates
  const allTemplates = [
    ...defaultPresetTemplates,
    ...adminTemplates
      .filter((t) => !defaultPresetTemplates.some((dp) => dp.key === t.themeKey))
      .map((t) => ({
        key: t.themeKey,
        name: t.name,
        badge: t.isDefault ? "Default" : "Admin Template",
        description: t.description || "Admin created theme template with custom background and colors.",
        primary: t.primaryColor || "#6366f1",
        bg: t.bgColor || "#0f172a",
        cardBg: t.cardBg || "#1e293b",
        text: t.textColor || "#f8fafc",
        bgImage: t.bgImage
      })),
    {
      key: "custom",
      name: "Custom Color Scheme",
      badge: "Personalized",
      description: "Design your own custom color scheme. Choose accent colors, background colors, and typography tone.",
      primary: colors.themePrimary,
      bg: colors.themeBg,
      cardBg: colors.themeCardBg,
      text: colors.themeText
    }
  ];

  const handleSelectPreset = async (tpl) => {
    setActiveTheme(tpl.key);
    const newColors = {
      themePrimary: tpl.primary,
      themeBg: tpl.bg,
      themeCardBg: tpl.cardBg,
      themeText: tpl.text,
    };
    setColors(newColors);

    try {
      setSaving(true);
      const res = await API.put("/user/theme", {
        activeTemplate: tpl.key,
        ...newColors
      });
      addToast(res.data.message || "Theme applied!", "success");
      setUser((prev) => ({
        ...prev,
        activeTemplate: tpl.key,
        ...newColors
      }));
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomColors = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await API.put("/user/theme", {
        activeTemplate: activeTheme,
        ...colors
      });
      addToast("Custom theme colors saved successfully!", "success");
      setUser((prev) => ({
        ...prev,
        activeTemplate: activeTheme,
        ...colors
      }));
    } catch (err) {
      addToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading templates & themes..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🎨 Portfolio Themes & Admin Templates</h2>
        <p>Choose from preset themes, admin-created templates, or customize background colors and accents for <code>/portfolio/{user?.username}</code>.</p>
      </div>

      {/* Templates Grid (Default + Admin Created) */}
      <div className="theme-grid">
        {allTemplates.map((tpl) => (
          <motion.div
            whileHover={{ y: -4 }}
            key={tpl.key}
            className={`card theme-card ${activeTheme === tpl.key ? "selected-theme" : ""}`}
          >
            <div
              className="theme-preview-header"
              style={{
                backgroundColor: tpl.bg,
                color: tpl.text,
                backgroundImage: tpl.bgImage ? `url(http://localhost:5000${tpl.bgImage})` : "none",
                backgroundSize: "cover"
              }}
            >
              <div className="theme-preview-dots">
                <span style={{ backgroundColor: tpl.primary }}></span>
                <span style={{ backgroundColor: "#f59e0b" }}></span>
                <span style={{ backgroundColor: "#10b981" }}></span>
              </div>
              <div className="theme-preview-mock">
                <h3 style={{ color: tpl.primary }}>{tpl.name}</h3>
                <span className="theme-badge" style={{ backgroundColor: tpl.primary, color: "#fff" }}>
                  {tpl.badge}
                </span>
              </div>
            </div>

            <div className="theme-card-body">
              <p>{tpl.description}</p>
              <button
                onClick={() => handleSelectPreset(tpl)}
                disabled={saving}
                className={`btn-block ${activeTheme === tpl.key ? "btn-success" : "btn-primary"}`}
              >
                {activeTheme === tpl.key ? "✓ Active Theme" : "Apply Theme"}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Color Palette Customizer */}
      <div className="card card-form mt-4">
        <h3>🎨 Fine-Tune Theme Colors & Backgrounds</h3>
        <p className="card-subtext">Customize exact HEX colors for your portfolio background, cards, and accent buttons.</p>

        <form onSubmit={handleSaveCustomColors} className="form-stack">
          <div className="form-grid-2">
            <div className="form-group">
              <label>Primary Accent Color</label>
              <div className="color-picker-input">
                <input
                  type="color"
                  value={colors.themePrimary}
                  onChange={(e) => setColors({ ...colors, themePrimary: e.target.value })}
                />
                <input
                  type="text"
                  value={colors.themePrimary}
                  onChange={(e) => setColors({ ...colors, themePrimary: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Page Background Color</label>
              <div className="color-picker-input">
                <input
                  type="color"
                  value={colors.themeBg}
                  onChange={(e) => setColors({ ...colors, themeBg: e.target.value })}
                />
                <input
                  type="text"
                  value={colors.themeBg}
                  onChange={(e) => setColors({ ...colors, themeBg: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Card Background Color</label>
              <div className="color-picker-input">
                <input
                  type="color"
                  value={colors.themeCardBg}
                  onChange={(e) => setColors({ ...colors, themeCardBg: e.target.value })}
                />
                <input
                  type="text"
                  value={colors.themeCardBg}
                  onChange={(e) => setColors({ ...colors, themeCardBg: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Main Text Color</label>
              <div className="color-picker-input">
                <input
                  type="color"
                  value={colors.themeText}
                  onChange={(e) => setColors({ ...colors, themeText: e.target.value })}
                />
                <input
                  type="text"
                  value={colors.themeText}
                  onChange={(e) => setColors({ ...colors, themeText: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Live Palette Preview Strip */}
          <div className="color-preview-strip">
            <div className="strip-item" style={{ backgroundColor: colors.themeBg, color: colors.themeText }}>
              <span>Page Background</span>
            </div>
            <div className="strip-item" style={{ backgroundColor: colors.themeCardBg, color: colors.themeText, border: `1px solid ${colors.themePrimary}` }}>
              <span>Card Background</span>
            </div>
            <div className="strip-item" style={{ backgroundColor: colors.themePrimary, color: "#ffffff" }}>
              <span>Accent Primary</span>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving Colors..." : "🎨 Save Custom Colors"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PortfolioTheme;
