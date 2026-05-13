import { createContext, useContext, useState, useEffect, useRef } from "react";
import { loginUser } from "../api/authApi";

const AuthContext = createContext(null);

// Helper: Decode JWT token and check if expired (client-side only)
function isTokenExpired(token) {
  if (!token) return true;

  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      // Not a JWT token, assume valid (could be session token)
      return false;
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check if token has expiration
    if (!payload.exp) {
      // No expiration in token, assume valid
      return false;
    }

    // exp is in seconds, current time is in milliseconds
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();

    return currentTime > expirationTime;
  } catch (error) {
    console.warn("Could not decode token:", error.message);
    // If we can't decode, assume valid (safer than rejecting)
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initialization attempts
    if (initializingRef.current || isInitialized) return;
    initializingRef.current = true;

    const initializeAuth = () => {
      try {
        const stored = localStorage.getItem("user");
        if (!stored) {
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        const userData = JSON.parse(stored);

        // Check if token is expired (client-side validation only)
        if (userData.token) {
          if (isTokenExpired(userData.token)) {
            // Token is expired, clear it
            console.warn("Stored token is expired, clearing...");
            localStorage.removeItem("user");
            setUser(null);
          } else {
            // Token is still valid, restore user
            setUser(userData);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        localStorage.removeItem("user");
        setUser(null);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    // Initialize synchronously (no async needed)
    initializeAuth();
  }, [isInitialized]);

  const login = async (username, password) => {
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const res = await loginUser(formData);

      if (res.Status) {
        const userData = {
          username,
          token: res.Token,
          role: res.Role.toLowerCase(),
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        return { success: true, user: userData };
      } else {
        return { success: false, message: res.Message };
      }
    } catch (error) {
      return { success: false, message: "Server error" };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    // Use history instead of location.href to prevent full reload
    window.history.pushState(null, "", "/#/login");
    window.location.href = "/#/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
