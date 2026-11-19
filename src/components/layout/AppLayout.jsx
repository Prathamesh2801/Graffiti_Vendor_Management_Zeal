import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import InstallPrompt from "../features/vendor/InstallPrompt";
import { useAuth } from "../../context/AuthContext";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [vendorMeta, setVendorMeta] = useState({
    isOnline: navigator.onLine,
    syncingNow: false,
  });

  return (
    /* Full page — NO padding-left, sidebar is a floating overlay */
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Sidebar drawer — renders as fixed overlay when open */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Install card for every role; pops up by itself only for vendors */}
      <InstallPrompt vendor={user?.role === "vendor"} />

      {/* Content always fills 100% width — sidebar never displaces it */}
      <div
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          isOnline={vendorMeta.isOnline}
          syncingNow={vendorMeta.syncingNow}
        />

        {/* Page content */}
        <main
          style={{
            flex: 1,
            padding: "28px",
            paddingBottom: "calc(28px + env(safe-area-inset-bottom))", // above the iPhone home bar
          }}
        >
          <Outlet context={{ setVendorMeta }} />
        </main>
      </div>
    </div>
  );
}
