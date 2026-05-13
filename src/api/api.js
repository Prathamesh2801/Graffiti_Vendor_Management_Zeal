import axios from "axios";
import { BASE_URL } from "../../config";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }

  return config;
});

// Track 401 state to prevent infinite loops
let isHandling401 = false;
let isTokenInvalidated = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token invalid, expired, or logged in elsewhere)
    if (error.response?.status === 401) {
      // If already handling 401, don't process again (prevents loop)
      if (isHandling401 || isTokenInvalidated) {
        return Promise.reject(error);
      }

      isHandling401 = true;
      isTokenInvalidated = true;

      // Clear auth data immediately
      localStorage.removeItem("user");

      // Show user-friendly message
      const reason = error.response?.data?.message || 
                     "Your session has ended. Please log in again.";
      
      toast.error(reason, {
        duration: 5000,
      });

      // Redirect to login immediately
      setTimeout(() => {
        if (window.location.hash !== "#/login") {
          window.location.href = "/#/login";
        }
        isHandling401 = false;
      }, 300);

      return Promise.reject(error);
    }

    // Reset flag for non-401 errors
    isHandling401 = false;

    return Promise.reject(error);
  }
);

export default api;