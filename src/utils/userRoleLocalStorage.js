export const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};
// Two separate login doors (same auth.php): vendors → /login (phone + OTP),
// admins & clients → /admin-login (username + password). Remember which kind of user last
// signed in on this device, so logout / session expiry send them back to THEIR page.
// Vendors (and fresh devices) default to /login; the vendor page never mentions staff.
const PORTAL_KEY = "last_login_portal";
export const rememberLoginPortal = (role) =>
  localStorage.setItem(PORTAL_KEY, role === "vendor" ? "vendor" : "staff");
export const loginPath = () =>
  localStorage.getItem(PORTAL_KEY) === "staff" ? "/admin-login" : "/login";
