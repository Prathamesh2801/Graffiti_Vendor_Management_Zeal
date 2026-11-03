import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Login/register pages: bounce already-logged-in users into the app.
export default function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/app" replace /> : children;
}
