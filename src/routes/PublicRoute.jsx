import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();

  // Show children while loading to prevent redirect away from login
  if (isLoading) return children;

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return children;
}