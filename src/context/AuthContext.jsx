/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { loginUser } from "../api/authApi";
import { setUnauthorizedHandler } from "../api/api";
import { getUserFromStorage } from "../utils/userRoleLocalStorage";

const AuthContext = createContext(null);

// Client-side expiry check for JWTs. Non-JWT / undecodable tokens are treated
// as valid and left for the server to reject with a 401.
function isTokenExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const { exp } = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return exp ? Date.now() > exp * 1000 : false;
  } catch {
    return false;
  }
}

function readStoredUser() {
  const stored = getUserFromStorage();
  if (stored?.token && !isTokenExpired(stored.token)) return stored;
  localStorage.removeItem("user");
  return null;
}

export function AuthProvider({ children }) {
  // localStorage is synchronous, so there is no "loading" phase to render around.
  const [user, setUser] = useState(readStoredUser);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("vendor_records_cache"); // don't leak one vendor's records to the next
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      logout();
      // Fixed id → parallel 401s show one toast, not five.
      toast.error(message || "Your session has ended. Please log in again.", {
        id: "session-expired",
        duration: 5000,
      });
    });
  }, [logout]);

  const login = async (username, password) => {
    try {
      const res = await loginUser({ username, password });
      if (!res.Status) return { success: false, message: res.Message };

      const userData = { username, token: res.Token, role: res.Role.toLowerCase() };
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      return { success: true, user: userData };
    } catch {
      return { success: false, message: "Server error" };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
