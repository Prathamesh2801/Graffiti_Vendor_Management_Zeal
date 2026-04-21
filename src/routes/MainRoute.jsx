import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RootRedirect from "./RootRedirect";
import RoleRoute from "./RoleRoute";
import AppRedirect from "./AppRedirect";
import Login from "../pages/auth/Login";
import AppLayout from "../components/layout/AppLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import CampaignMap from "../pages/campaign/CampaignMap";
import UserAuth from "../pages/admin/UserAuth";
import CampaignList from "../pages/campaign/CampaignList";
import VendorDashboard from "../pages/vendor/VendorDashboard";

export default function MainRoute() {
  const router = createHashRouter([
    {
      path: "/",
      element: <RootRedirect />,
    },
    {
      path: "/geo",
      element: <CampaignMap />,
    },

    {
      path: "/login",
      element: (
        <PublicRoute>
          <Login />
        </PublicRoute>
      ),
    },
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <AppRedirect /> },
        {
          path: "dashboard",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <Dashboard />
            </RoleRoute>
          ),
        },
        {
          path: "user-auth",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <UserAuth />
            </RoleRoute>
          ),
        },
        {
          path: "campaigns",
          element: (
            <RoleRoute allowedRoles={["admin", "client"]}>
              <CampaignList />
            </RoleRoute>
          ),
        },
        {
          path: "vendor",
          element: (
            <RoleRoute allowedRoles={["vendor"]}>
              <VendorDashboard />
            </RoleRoute>
          ),
        },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/" />,
    },
  ]);

  return <RouterProvider router={router} />;
}
