import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginPath } from "../utils/userRoleLocalStorage";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to={loginPath()} replace />;
}
