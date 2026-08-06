import axios from "axios";
import { BASE_URL } from "../../config";

export const registerVendor = async (payload) => {
  try {
    const formData = new FormData();

    formData.append("Username", payload.phone);

    formData.append("Fullname", payload.fullName);

    const response = await axios.post(`${BASE_URL}/Vendor/otp.php`, formData);

    return response.data;
  } catch (error) {
    console.error("Vendor Registration Error:", error);

    return {
      Status: false,
      Message: "Registration failed",
    };
  }
};
