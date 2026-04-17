import { motion } from "framer-motion";
import { Users, UserCheck, Briefcase, Shield } from "lucide-react";
import { DUMMY_USERS } from "../../data/user";

const stats = [
  {
    label: "Total Users",
    value: DUMMY_USERS.length,
    icon: Users,
    color: "var(--color-primary)",
    bg: "var(--color-primary-50)",
  },
  {
    label: "Active",
    value: DUMMY_USERS.filter((u) => u.status === "Active").length,
    icon: UserCheck,
    color: "var(--color-success)",
    bg: "#EAF7F0",
  },
  {
    label: "Vendors",
    value: DUMMY_USERS.filter((u) => u.role === "Intern").length,
    icon: Briefcase,
    color: "var(--color-complement)",
    bg: "#E0F8F5",
  },
  {
    label: "Clients",
    value: DUMMY_USERS.filter((u) => u.role === "Client").length,
    icon: Shield,
    color: "var(--color-accent)",
    bg: "#FEF9E7",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.35 },
  }),
};

export default function Dashboard() {
  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-secondary">
          Overview
        </h2>
        <p className="text-text-secondary text-sm mt-1 font-body">
          Welcome to the Graffiti Campaign admin panel.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            custom={i}
            initial="hidden"
            animate="show"
            variants={cardVariants}
            className="bg-bg-card rounded-2xl p-5 border"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: s.bg }}
              >
                <s.icon size={20} style={{ color: s.color }} />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-secondary">
              {s.value}
            </p>
            <p className="text-text-secondary text-xs font-body mt-1 uppercase tracking-wider">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recent users preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="bg-bg-card rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h3 className="font-display font-bold text-lg uppercase tracking-wide text-secondary">
            Recent Users
          </h3>
          <span className="text-xs font-body text-text-muted">
            Last 5 records
          </span>
        </div>
        <div
          className="divide-y"
          style={{ borderColor: "var(--color-border)" }}
        >
          {DUMMY_USERS.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center gap-4 px-6 py-3.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-bold text-white flex-shrink-0"
                style={{ background: "var(--color-primary)" }}
              >
                {u.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-text-primary truncate">
                  {u.username}
                </p>
                <p className="text-xs text-text-muted font-body">
                  {u.createdAt}
                </p>
              </div>
              <span
                className={`text-xs font-display font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                  u.role === "Intern"
                    ? "text-complement bg-[#E0F8F5]"
                    : u.role === "Client"
                      ? "text-warning bg-[#FEF9E7]"
                      : "text-primary bg-primary-50"
                }`}
              >
                {u.role}
              </span>
              <span
                className={`text-xs font-body px-2.5 py-1 rounded-full ${
                  u.status === "Active"
                    ? "bg-[#EAF7F0] text-success"
                    : "bg-bg-surface text-text-muted"
                }`}
              >
                {u.status}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
