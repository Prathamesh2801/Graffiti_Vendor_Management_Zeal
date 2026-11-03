import { lazy, Suspense } from "react";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import RoleRoute from "./RoleRoute";
import HomeRedirect from "./HomeRedirect";
import Login from "../pages/auth/Login";
import VendorRegister from "../pages/auth/VendorRegister";
import AppLayout from "../components/layout/AppLayout";
import VendorDashboard from "../pages/vendor/VendorDashboard";

// Admin/map pages pull in xlsx, leaflet, qrcode — split them out so vendor
// phones don't download them. The PWA still precaches every chunk for offline.
const CampaignMap = lazy(() => import("../pages/campaign/CampaignMap"));
const CampaignList = lazy(() => import("../pages/campaign/CampaignList"));
const CampaignSubmissions = lazy(() => import("../pages/campaign/CampaignSubmissions"));
const UserAuth = lazy(() => import("../pages/admin/UserAuth"));

const role = (allowedRoles, element) => (
  <RoleRoute allowedRoles={allowedRoles}>{element}</RoleRoute>
);

// Created once at module load — never inside a component.
// Hash router because the PHP host serves index.html without SPA rewrites.
const router = createHashRouter([
  { path: "/", element: <HomeRedirect /> },
  { path: "/geo", element: <CampaignMap /> }, // public: opened from campaign QR codes
  { path: "/login", element: <PublicRoute><Login type="vendor" /></PublicRoute> },
  { path: "/admin-login", element: <PublicRoute><Login type="admin" /></PublicRoute> },
  { path: "/register", element: <PublicRoute><VendorRegister /></PublicRoute> },
  {
    path: "/app",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "user-auth", element: role(["admin"], <UserAuth />) },
      { path: "campaigns", element: role(["admin", "client"], <CampaignList />) },
      { path: "campaigns/:id/submissions", element: role(["admin", "client"], <CampaignSubmissions />) },
      { path: "vendor", element: role(["vendor"], <VendorDashboard />) },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function MainRoute() {
  return (
    <Suspense fallback={null}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
