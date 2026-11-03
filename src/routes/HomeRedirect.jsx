import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HOME_BY_ROLE = {
  admin: "/app/campaigns",
  client: "/app/campaigns",
  vendor: "/app/vendor",
};

// Sends the user to their role's landing page (or /login).
export default function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={HOME_BY_ROLE[user?.role] || "/login"} replace />;
}
