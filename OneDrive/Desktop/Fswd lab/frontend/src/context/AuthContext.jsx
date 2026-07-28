import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("portfolio_theme") || "dark");

  // Apply dark/light theme class to <html> element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("portfolio_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await API.get("/auth/me");
      if (res.data && res.data.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const loginUser = async (credentials) => {
    const res = await API.post("/auth/login", credentials);
    if (res.data && res.data.user) {
      setUser(res.data.user);
    }
    return res.data;
  };

  const logoutUser = async () => {
    try {
      await API.post("/auth/logout");
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        theme,
        toggleTheme,
        checkAuth,
        loginUser,
        logoutUser,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
