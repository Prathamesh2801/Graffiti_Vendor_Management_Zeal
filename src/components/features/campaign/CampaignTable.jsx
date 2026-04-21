import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Trash2,
  FileDown,
  Users,
  QrCode,
} from "lucide-react";
import { getUserFromStorage } from "../../../utils/userRoleLocalStorage";

const COLUMNS = [
  { key: "srNo", label: "#", sortable: false },
  { key: "name", label: "Campaign", sortable: true },
  { key: "state", label: "State", sortable: true },
  { key: "walls", label: "Walls", sortable: true },
  { key: "startDate", label: "Start", sortable: true },
  { key: "endDate", label: "End", sortable: true },
  { key: "assignedUsers", label: "Assigned Users", sortable: false },
  { key: "actions", label: "Actions", sortable: false },
];

function SortIcon({ field, sortField, sortOrder }) {
  if (sortField !== field)
    return <ArrowUpDown size={12} className="opacity-30" />;
  return sortOrder === "asc" ? (
    <ArrowUp size={12} style={{ color: "var(--color-primary)" }} />
  ) : (
    <ArrowDown size={12} style={{ color: "var(--color-primary)" }} />
  );
}

export default function CampaignTable({
  campaigns,
  loading,
  sortField,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onExportCodes,
  onShowQr,
  isAdmin
}) {
  
  return (
    <div
      className="rounded-2xl border overflow-hidden mb-3"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr
              className="border-b"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg)",
              }}
            >
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3.5 text-left text-xs font-display font-semibold uppercase tracking-wider select-none"
                  style={{
                    color: "var(--color-text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => onSort(col.key)}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      {col.label}
                      <SortIcon
                        field={col.key}
                        sortField={sortField}
                        sortOrder={sortOrder}
                      />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div
                    className="flex flex-col items-center gap-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <div
                      className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                      style={{
                        borderColor: "var(--color-primary)",
                        borderTopColor: "transparent",
                      }}
                    />
                    <span className="text-xs">Loading campaigns…</span>
                  </div>
                </td>
              </tr>
            ) : campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16">
                  <div
                    className="flex flex-col items-center gap-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <FileDown size={28} className="opacity-30" />
                    <span className="text-sm">No campaigns found</span>
                  </div>
                </td>
              </tr>
            ) : (
              campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b transition-colors"
                  style={{ borderColor: "var(--color-border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-bg)")
                  }
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td
                    className="px-4 py-3.5 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.srNo}
                  </td>
                  <td className="px-4 py-3.5">
                    <div
                      className="font-semibold"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {c.name}
                    </div>
                    {c.description && (
                      <div
                        className="text-xs mt-0.5 max-w-[200px] truncate"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background:
                          "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {c.state}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3.5 font-medium"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {c.walls}
                  </td>
                  <td
                    className="px-4 py-3.5 text-xs font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.startDate}
                  </td>
                  <td
                    className="px-4 py-3.5 text-xs font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.endDate}
                  </td>
                  <td className="px-4 py-3.5">
                    {(c.assignedUsers || []).length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Users
                          size={12}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                        <div className="flex flex-wrap gap-1">
                          {c.assignedUsers.slice(0, 2).map((u) => (
                            <span
                              key={u}
                              className="inline-block px-2 py-0.5 rounded-md text-xs"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--color-secondary) 12%, transparent)",
                                color: "var(--color-secondary)",
                              }}
                            >
                              {u}
                            </span>
                          ))}
                          {c.assignedUsers.length > 2 && (
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              +{c.assignedUsers.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <ActionBtn
                        icon={<Eye size={13} />}
                        title="View"
                        color="var(--color-primary)"
                        onClick={() => onView(c)}
                      />
                      {isAdmin && (
                        <ActionBtn
                          icon={<Pencil size={13} />}
                          title="Edit"
                          color="var(--color-secondary)"
                          onClick={() => onEdit(c)}
                        />
                      )}
                      {isAdmin && (
                        <ActionBtn
                          icon={<FileDown size={13} />}
                          title="Export Codes"
                          color="#10b981"
                          onClick={() => onExportCodes(c)}
                        />
                      )}
                      {isAdmin && (
                        <ActionBtn
                          icon={<Trash2 size={13} />}
                          title="Delete"
                          color="#ef4444"
                          onClick={() => onDelete(c)}
                        />
                      )}
                      <ActionBtn
                        icon={<QrCode size={13} />}
                        title="QR Code"
                        color="var(--color-primary)"
                        onClick={() => onShowQr(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ icon, title, color, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg transition-all hover:scale-110 active:scale-95"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 12%, transparent)`,
      }}
    >
      {icon}
    </button>
  );
}
