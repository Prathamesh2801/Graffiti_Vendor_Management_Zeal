import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, LogIn, ArrowLeft, MessageSquareText, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneField from "../../components/features/auth/PhoneField";
import { AuthInstallHint } from "../../components/features/vendor/InstallPrompt";
import { resendOtp } from "../../api/authApi";
import { isValidMobile, maskPhone } from "../../utils/phone";
import { useCooldown, fmtCooldown } from "../../hooks/useCooldown";

const RESEND_SECONDS = 30;
const labelClass =
  "block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-2";
const fieldClass =
  "w-full px-4 py-3 rounded-xl border border-[color:var(--color-border)] text-sm font-body text-text-primary " +
  "bg-bg-page outline-none transition-colors placeholder:text-text-muted focus:border-primary";
const primaryBtn =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-semibold uppercase " +
  "tracking-wider text-sm text-white bg-primary hover:bg-primary-dark transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]";

const Spinner = () => (
  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
);

export default function Login({ type = "vendor" }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation(); // from Register: { phone, otpSent }
  const isVendor = type === "vendor";

  const [form, setForm] = useState({ username: state?.phone ?? "", password: "" });
  const [mode, setMode] = useState("login"); // vendor: "login" | "forgot"
  const [sentTo, setSentTo] = useState(state?.otpSent ? state.phone : "");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [cooldown, setCooldown] = useCooldown(state?.otpSent ? RESEND_SECONDS : 0);

  const setPhone = (v) => {
    setForm((f) => ({ ...f, username: v }));
    setPhoneError("");
  };

  const checkPhone = () => {
    if (isValidMobile(form.username)) return true;
    setPhoneError("Enter your 10-digit mobile number");
    return false;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isVendor && !checkPhone()) return;
    if (!form.username || !form.password) {
      toast.error(isVendor ? "Enter the OTP from your SMS" : "Please fill in all fields");
      return;
    }
    setLoading(true);
    const result = await login(form.username, form.password);
    setLoading(false);
    if (result.success) {
      toast.success(`Welcome back, ${result.user.username}!`);
      navigate("/app");
    } else if (isVendor && /invalid credentials/i.test(result.message || "")) {
      toast.error("Wrong mobile number or OTP. Tap “Forgot OTP?” to get it again.", { duration: 5000 });
    } else {
      toast.error(result.message || "Login failed");
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!checkPhone()) return;
    setLoading(true);
    try {
      const res = await resendOtp(form.username);
      if (!res?.Status) {
        toast.error(res?.Message || "Couldn't send the OTP. Check the number and try again.");
        return;
      }
      setCooldown(RESEND_SECONDS);
      setForm((f) => ({ ...f, password: "" }));
      setSentTo(form.username);
      setMode("login");
    } catch {
      toast.error("Couldn't send the OTP. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center relative overflow-hidden py-8">
      {/* Background decorative graffiti-style shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-5 bg-primary" />
        <div className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full opacity-5 bg-secondary" />
        <div className="absolute top-1/2 left-1/4 w-3 h-24 opacity-10 rotate-12 bg-accent" />
        <div className="absolute top-1/3 right-1/4 w-3 h-16 opacity-10 -rotate-6 bg-primary" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md mx-4 relative"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-primary">
            <span className="font-display text-white text-2xl font-bold tracking-wider">GC</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-secondary tracking-wide uppercase">
            Graffiti Campaign
          </h1>
          <p className="text-text-secondary text-sm mt-1 font-body">
            {isVendor ? "Vendor sign in to continue" : "Administrator access portal"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-card rounded-2xl p-6 sm:p-8 shadow-sm border border-[color:var(--color-border)]">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "forgot" ? (
              /* ── Forgot OTP: same card, one field ── */
              <motion.form
                key="forgot"
                onSubmit={handleSendOtp}
                className="space-y-5"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wide text-secondary">
                    Get your OTP again
                  </h2>
                  <p className="text-sm text-text-secondary mt-1">
                    Enter your registered mobile number. We'll SMS your OTP password to it.
                  </p>
                </div>
                <PhoneField value={form.username} onChange={setPhone} error={phoneError} autoFocus />
                <button type="submit" disabled={loading || cooldown > 0} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Spinner /> Sending…
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${fmtCooldown(cooldown)}`
                  ) : (
                    <>
                      <MessageSquareText size={16} /> Send OTP
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary"
                >
                  <ArrowLeft size={15} /> Back to sign in
                </button>
              </motion.form>
            ) : (
              /* ── Sign in ── */
              <motion.form
                key="login"
                onSubmit={handleLogin}
                className="space-y-5"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2 }}
              >
                {isVendor && sentTo && (
                  <div
                    className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                    style={{ background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.3)" }}
                  >
                    <CheckCircle2 size={17} className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary leading-snug">
                      OTP sent by SMS to <b className="text-text-primary">{maskPhone(sentTo)}</b>. Enter it below.
                    </span>
                  </div>
                )}

                {isVendor ? (
                  <PhoneField value={form.username} onChange={setPhone} error={phoneError} />
                ) : (
                  <div>
                    <label className={labelClass}>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      placeholder="Enter username"
                      autoComplete="username"
                      className={fieldClass}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className={`${labelClass} mb-0`}>{isVendor ? "OTP Password" : "Password"}</label>
                    {isVendor && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Forgot OTP?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      // OTP just sent → cursor lands here when the form appears (phone keyboards
                      // then offer the code from the SMS). autoFocus runs on mount, so it also
                      // works after the "Forgot OTP" card animates out.
                      autoFocus={isVendor && !!sentTo}
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder={isVendor ? "Enter the OTP from your SMS" : "Enter password"}
                      // Vendors: numeric keypad + iOS/Android "code from Messages" suggestion.
                      inputMode={isVendor ? "numeric" : undefined}
                      autoComplete={isVendor ? "one-time-code" : "current-password"}
                      className={`${fieldClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide" : "Show"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-secondary transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <Spinner /> Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn size={16} /> Sign In
                    </>
                  )}
                </button>

                {isVendor && (
                  <p className="text-center text-sm text-text-secondary">
                    New vendor?{" "}
                    <Link to="/register" className="text-primary font-semibold hover:underline">
                      Register
                    </Link>
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {isVendor && <AuthInstallHint />}
      </motion.div>
    </div>
  );
}
