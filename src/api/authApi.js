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
