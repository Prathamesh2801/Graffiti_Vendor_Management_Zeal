import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, UserPlus, LogIn } from "lucide-react";
import { registerVendor } from "../../api/authApi";
import PhoneField from "../../components/features/auth/PhoneField";
import { AuthInstallHint, IosSteps } from "../../components/features/vendor/InstallPrompt";
import { installVariant } from "../../utils/pwaPrompt";
import { isValidMobile, maskPhone } from "../../utils/phone";
import { useCooldown, fmtCooldown } from "../../hooks/useCooldown";

const RESEND_SECONDS = 30;
const labelClass =
  "block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-2";
const primaryBtn =
  "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-display font-semibold uppercase " +
  "tracking-wider text-sm text-white bg-primary hover:bg-primary-dark transition-colors " +
  "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]";

export default function VendorRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false); // success screen
  const [cooldown, setCooldown] = useCooldown();

  const validate = () => {
    const e = {};
    const name = form.fullName.trim();
    if (!name) e.fullName = "Full name is required";
    else if (name.length < 3) e.fullName = "Minimum 3 characters required";
    if (!isValidMobile(form.phone)) e.phone = "Enter a valid 10-digit mobile number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Also used for "Resend": otp.php re-sends the same OTP when the number already exists.
  const send = async () => {
    setLoading(true);
    try {
      const res = await registerVendor({ phone: form.phone, fullName: form.fullName.trim() });
      if (!res?.Status) {
        toast.error(res?.Message || "Registration failed");
        return false;
      }
      setCooldown(RESEND_SECONDS);
      return true;
    } catch {
      toast.error("Something went wrong. Check your internet and try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate() && (await send())) setDone(true);
  };

  const iosNotInstalled = installVariant() === "ios";

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center relative overflow-hidden py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full opacity-5 bg-primary" />
        <div className="absolute -bottom-24 -right-12 w-96 h-96 rounded-full opacity-5 bg-secondary" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-md mx-4 relative"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4 bg-primary">
            <span className="font-display text-white text-2xl font-bold tracking-wider">GC</span>
          </div>
          <h1 className="font-display text-4xl font-bold text-secondary tracking-wide uppercase">
            Vendor Registration
          </h1>
          <p className="text-text-secondary text-sm mt-1">
            {done ? "You're all set" : "Create your vendor account to continue"}
          </p>
        </div>

        <div className="bg-bg-card rounded-2xl p-6 sm:p-8 shadow-sm border border-[color:var(--color-border)]">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              /* ── Success ── */
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-5"
              >
                <CheckCircle2 size={48} className="mx-auto text-success" />
                <div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-secondary">
                    You're registered!
                  </h2>
                  <p className="text-sm text-text-secondary mt-2 leading-relaxed">
                    Your OTP password has been sent by SMS to{" "}
                    <b className="text-text-primary">{maskPhone(form.phone)}</b>. It's your login
                    password and doesn't expire, so keep the message.
                  </p>
                </div>

                {iosNotInstalled && (
                  <div className="text-left rounded-xl p-4 bg-bg-page border border-[color:var(--color-border)]">
                    <p className="text-sm font-semibold text-text-primary mb-3">
                      Next on iPhone: add the app to your Home Screen, then sign in from there.
                    </p>
                    <IosSteps />
                  </div>
                )}

                <button
                  type="button"
                  className={primaryBtn}
                  onClick={() => navigate("/login", { state: { phone: form.phone, otpSent: true } })}
                >
                  <LogIn size={16} /> Continue to sign in
                </button>

                <p className="text-sm text-text-secondary">
                  Didn't get the SMS?{" "}
                  <button
                    type="button"
                    disabled={loading || cooldown > 0}
                    onClick={async () => (await send()) && toast.success("OTP sent again")}
                    className="font-semibold text-primary disabled:text-text-muted"
                  >
                    {cooldown > 0 ? `Resend in ${fmtCooldown(cooldown)}` : loading ? "Sending…" : "Resend OTP"}
                  </button>
                </p>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-5" exit={{ opacity: 0 }}>
                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, fullName: e.target.value }));
                      setErrors((x) => ({ ...x, fullName: "" }));
                    }}
                    placeholder="Enter full name"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-body text-text-primary bg-bg-page outline-none transition-colors placeholder:text-text-muted focus:border-primary ${
                      errors.fullName ? "border-danger" : "border-[color:var(--color-border)]"
                    }`}
                  />
                  {errors.fullName && <p className="text-xs mt-1.5 text-danger">{errors.fullName}</p>}
                </div>

                <PhoneField
                  value={form.phone}
                  onChange={(v) => {
                    setForm((f) => ({ ...f, phone: v }));
                    setErrors((x) => ({ ...x, phone: "" }));
                  }}
                  error={errors.phone}
                />

                <button type="submit" disabled={loading} className={primaryBtn}>
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} /> Register &amp; get OTP
                    </>
                  )}
                </button>

                <p className="text-center text-sm text-text-secondary">
                  Already registered?{" "}
                  <Link to="/login" className="text-primary font-semibold hover:underline">
                    Sign in
                  </Link>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!done && <AuthInstallHint />}
      </motion.div>
    </div>
  );
}
