import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginPath } from "../utils/userRoleLocalStorage";

export default function RoleRoute({ allowedRoles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to={loginPath()} replace />;
  return allowedRoles.includes(user.role) ? children : <Navigate to="/app" replace />;
}
