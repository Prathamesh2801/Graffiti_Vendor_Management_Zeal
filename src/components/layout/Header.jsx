import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { Menu } from "lucide-react";

const ROLE_CONFIG = {
  admin: { label: "Admin", icon: "A" },
  client: { label: "Client", icon: "C" },
  vendor: { label: "Vendor", icon: "V" },
};

export default function Header({
  onMenuClick,
  isOnline,
  syncingNow,
  pendingSync,
}) {
  const { user } = useAuth();

  const role = user?.role;
  const username = user?.username || "User";

  const roleConfig = ROLE_CONFIG[role] || {
    label: "User",
    icon: "U",
  };

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 h-16 backdrop-blur-md"
      style={{
        background: "rgba(255,255,255,0.88)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* Hamburger — always visible */}
      <button
        onClick={onMenuClick}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: "6px 8px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-secondary)",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--color-bg-secondary)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <Menu size={20} />
      </button>
      {/* LEFT: Brand */}
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg font-black"
          style={{
            background: "var(--color-primary)",
            fontFamily: "var(--font-display)",
          }}
        >
          {roleConfig.icon}
        </div>

        <span
          className="text-base uppercase tracking-widest font-bold"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-secondary)",
          }}
        >
          {roleConfig.label}
          <span style={{ color: "var(--color-primary)" }}>Portal</span>
        </span>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2.5">
        {/* 🔥 Vendor-specific sync UI */}
        {role === "vendor" && (
          <AnimatePresence>
            {syncingNow && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-1 rounded-full text-xs font-bold uppercase"
                style={{
                  background: "rgba(247,201,72,0.12)",
                  color: "#9a6e00",
                }}
              >
                Syncing...
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* 🌐 Online status */}
        {role === "vendor" && (
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase"
            style={{
              background: isOnline
                ? "rgba(39,174,96,0.1)"
                : "rgba(201,42,42,0.1)",
              color: isOnline ? "var(--color-success)" : "var(--color-error)",
            }}
          >
            {isOnline ? "Online" : "Offline"}
          </div>
        )}

        {/* 👤 User */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
          style={{
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
            style={{
              background: "var(--color-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            {username[0]?.toUpperCase()}
          </span>

          <span className="hidden sm:block">{username}</span>
        </div>
      </div>
    </header>
  );
}
