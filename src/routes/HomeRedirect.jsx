import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginPath } from "../utils/userRoleLocalStorage";

const HOME_BY_ROLE = {
  admin: "/app/campaigns",
  client: "/app/campaigns",
  vendor: "/app/vendor",
};

// Sends the user to their role's landing page (or their login page).
export default function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME_BY_ROLE[user?.role] || loginPath()} replace />;
}
