import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const result = await login(form.username, form.password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.username}!`);
      navigate("/app");
    } else {
      toast.error(result.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center relative overflow-hidden">
      {/* Background decorative graffiti-style shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-5"
          style={{ background: "var(--color-primary)" }}
        />
        <div
          className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full opacity-5"
          style={{ background: "var(--color-secondary)" }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-3 h-24 opacity-10 rotate-12"
          style={{ background: "var(--color-accent)" }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-3 h-16 opacity-10 -rotate-6"
          style={{ background: "var(--color-primary)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md mx-4"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
            style={{ background: "var(--color-primary)" }}
          >
            <span className="font-display text-white text-2xl font-bold tracking-wider">
              GC
            </span>
          </div>
          <h1 className="font-display text-4xl font-bold text-secondary tracking-wide uppercase">
            Graffiti Campaign
          </h1>
          <p className="text-text-secondary text-sm mt-1 font-body">
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-bg-card rounded-2xl p-8 shadow-sm border"
          style={{ borderColor: "var(--color-border)" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Enter username"
                autoComplete="username"
                className="w-full px-4 py-3 rounded-xl border text-sm font-body text-text-primary bg-bg-page
                  outline-none transition-all duration-200
                  placeholder:text-text-muted"
                style={{
                  borderColor: "var(--color-border)",
                  focus: "border-primary",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "var(--color-primary)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "var(--color-border)")
                }
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-xl border text-sm font-body text-text-primary bg-bg-page
                    outline-none transition-all duration-200
                    placeholder:text-text-muted"
                  style={{ borderColor: "var(--color-border)" }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--color-primary)")
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = "var(--color-border)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display
                font-semibold uppercase tracking-wider text-sm text-white transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: loading
                  ? "var(--color-primary-dark)"
                  : "var(--color-primary)",
              }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.target.style.background = "var(--color-primary-dark)";
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.target.style.background = "var(--color-primary)";
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={16} />
                  Sign In
                </span>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
