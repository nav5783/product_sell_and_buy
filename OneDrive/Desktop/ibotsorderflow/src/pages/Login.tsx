import { useRef, useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const { login, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const normalizePhone = (s?: string) => {
    if (!s) return "";
    return s.replace(/\D/g, "").replace(/^0+/, "");
  };

  const lookupEmployeeEmail = async (identifier: string) => {
    // If looks like an email, use it directly (allow direct auth email login)
    if (identifier.includes("@")) {
      return identifier;
    }

    // treat as phone -> lookup employee doc to get associated email
    const digits = normalizePhone(identifier);
    if (digits) {
      const usersRef = collection(db, "employees");
      const q = query(usersRef, where("mobile", "==", digits));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data() as any;
        return data.email || null;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = emailRef.current?.value?.trim();
    const password = passwordRef.current?.value?.trim();

    if (!identifier || !password) {
      setError("Please enter both Email / Phone and password");
      return;
    }

    setLoading(true);

    try {
      const emailToUse = await lookupEmployeeEmail(identifier);
      if (!emailToUse) {
        throw new Error("Identifier not found. Please check Email or Phone.");
      }

      await login(emailToUse, password);
      setLoading(false);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Failed to log in. Please check credentials.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">iBots CRM</h1>
          <p className="text-gray-500 text-sm">Sign in to continue</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500 text-white p-3 rounded-md mb-4 flex items-center justify-between"
            >
              <span className="text-sm font-medium">{error}</span>
              <button onClick={() => setError(null)} className="ml-3" aria-label="Close error">
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email / Phone</label>
            <input
              type="text"
              ref={emailRef}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Enter email or phone"
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                ref={passwordRef}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Enter your password"
                required
                disabled={loading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold shadow hover:bg-indigo-700 transition disabled:bg-gray-400"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">© {new Date().getFullYear()} iBots. All rights reserved.</p>
      </div>
    </div>
  );
}
