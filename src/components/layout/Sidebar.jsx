import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  LogOut,
  ChevronRight,
  X,
  Tag,
} from "lucide-react";

const NAV_CONFIG = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, to: "/app/dashboard" },
    { label: "User Auth", icon: Users, to: "/app/user-auth" },
    { label: "Campaigns", icon: Megaphone, to: "/app/campaigns" },
  ],
  client: [{ label: "Campaigns", icon: Megaphone, to: "/app/campaigns" }],
  vendor: [{ label: "My Uploads", icon: LayoutDashboard, to: "/app/vendor" }],
};

const ROLE_LABEL = {
  admin: "Admin Panel",
  client: "Client Panel",
  vendor: "Vendor Panel",
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const NAV_ITEMS = NAV_CONFIG[role] || [];

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(2px)",
            }}
          />

          {/* Drawer panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            exit={{ x: -260 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ type: "tween", duration: 0.25, ease: "easeInOut" }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              height: "100dvh",
              width: 240,
              zIndex: 1001,
              background: "var(--color-secondary)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "6px 0 32px rgba(0,0,0,0.22)",
            }}
          >
            {/* Brand header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "24px 20px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  flexShrink: 0,
                  background: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Tag size={16} color="white" />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#fff",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    lineHeight: 1,
                  }}
                >
                  Graffiti
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.4)",
                    marginTop: 3,
                  }}
                >
                  {ROLE_LABEL[user?.role] || "Panel"}
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "rgba(255,255,255,0.6)",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.14)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.07)")
                }
              >
                <X size={15} />
              </button>
            </div>

            {/* Nav links */}
            <nav
              style={{
                flex: 1,
                padding: "16px 12px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  padding: "0 12px",
                  marginBottom: 8,
                }}
              >
                Navigation
              </div>

              {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 12,
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    fontWeight: 500,
                    textDecoration: "none",
                    transition: "all 0.15s",
                    background: isActive
                      ? "var(--color-primary)"
                      : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} />
                      <span style={{ flex: 1 }}>{label}</span>
                      <ChevronRight
                        size={12}
                        style={{ opacity: isActive ? 0.7 : 0 }}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User + logout */}
            <div
              style={{
                padding: "12px 12px 20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: "var(--color-accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--color-secondary)",
                  }}
                >
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {user?.username}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    {user?.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                }}
              >
                <LogOut size={15} />
                <span>Sign out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
