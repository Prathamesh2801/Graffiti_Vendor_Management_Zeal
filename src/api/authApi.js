import axios from "axios";
import { BASE_URL } from "../../config";

export const loginUser = async (formData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth.php`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Login API Error:", error);
    throw error;
  }
};