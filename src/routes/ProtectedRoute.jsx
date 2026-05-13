import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth();

  // Show nothing while loading to prevent flickering
  if (isLoading) return null;

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
