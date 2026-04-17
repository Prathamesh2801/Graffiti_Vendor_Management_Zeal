import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RootRedirect() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  if (user.role === "admin") return <Navigate to="/app/dashboard" />;
  if (user.role === "client") return <Navigate to="/app/campaigns" />;
  if (user.role === "vendor") return <Navigate to="/app/vendor" />;

  return <Navigate to="/login" />;
}