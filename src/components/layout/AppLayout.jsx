import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendorMeta, setVendorMeta] = useState({
    isOnline: navigator.onLine,
    syncingNow: false,
  });

  return (
    /* Full page — NO padding-left, sidebar is a floating overlay */
    <div style={{ minHeight: "100vh", background: "var(--color-bg)" }}>
      {/* Sidebar drawer — renders as fixed overlay when open */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
        <main style={{ flex: 1, padding: "28px 28px" }}>
          <Outlet context={{ setVendorMeta }} />
        </main>
      </div>
    </div>
  );
}
