import axios from "axios";
import { BASE_URL } from "../../config";
import { getUserFromStorage } from "../utils/userRoleLocalStorage";

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = getUserFromStorage()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// AuthContext registers this so a 401 clears React state too (not just
// localStorage) — the route guards then redirect to /login on their own.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only authenticated requests can "expire"; a wrong-password login is not a session end.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      onUnauthorized(error.response.data?.message || error.response.data?.Message);
    }
    return Promise.reject(error);
  },
);

export default api;
