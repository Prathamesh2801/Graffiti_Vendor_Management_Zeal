import { createContext, useContext, useState, useEffect } from "react";
import { loginUser } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("user");
    }
  }, []);

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
    window.location.href = "/#/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
