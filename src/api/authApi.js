import api from "./api";

export const loginUser = async ({ username, password }) => {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("password", password);
  const res = await api.post("/auth.php", formData);
  return res.data;
};

// Vendor self-registration: server sends the OTP password by SMS.
export const registerVendor = async ({ phone, fullName }) => {
  const formData = new FormData();
  formData.append("Username", phone);
  formData.append("Fullname", fullName);
  const res = await api.post("/Vendor/otp.php", formData);
  return res.data;
};

// Sent as Fullname on "Forgot OTP": otp.php requires a name but ignores it for existing numbers.
// Deliberately obvious so accidental accounts (a mistyped, unregistered number) are easy to
// spot and delete in User Management.
export const OTP_RESEND_PLACEHOLDER_NAME = "(OTP resend)";

// "Forgot OTP": otp.php re-sends the SAME (non-expiring) OTP when the number already exists.
// ponytail: stopgap — an unregistered number becomes an account named "(OTP resend)". Proper fix:
// a resend mode in otp.php that needs no Fullname and rejects unknown numbers.
// SMS spam protection must also live on the server (per-number rate limit); the 30-second
// button cooldown in the UI is a courtesy, not a defence.
export const resendOtp = async (phone) => {
  const formData = new FormData();
  formData.append("Username", phone);
  formData.append("Fullname", OTP_RESEND_PLACEHOLDER_NAME);
  const res = await api.post("/Vendor/otp.php", formData);
  return res.data;
};
