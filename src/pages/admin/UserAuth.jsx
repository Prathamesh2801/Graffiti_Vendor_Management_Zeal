import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Search,
  UserPlus,
} from "lucide-react";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../../api/userApi";
import { ArrowUp, ArrowDown } from "lucide-react";

const ROLES = ["Admin", "Client", "Vendor"];

const EMPTY_FORM = {
  username: "",
  password: "",
  role: "Admin",
};

export default function UserAuth() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPass, setShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [changePassword, setChangePassword] = useState(false);

  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      if (res.Status) {
        const formatted = res.Data.map((u, i) => ({
          id: i,
          srNo: i + 1,
          username: u.Username,
          password: "••••••",
          role: u.Role,
          status: u.Status,
          createdAt: u.Created_AT,
        }));

        setUsers(formatted);
      }
    } catch (err) {
      toast.error("Failed to load users");
    }
  };

  /* ─── Helpers ─── */

  const exportToExcel = () => {
    const data = users.map((u) => ({
      Username: u.username,
      Role: u.role,
      Status: u.status,
      Created: u.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "Users.xlsx");
  };

  //  -------------  Table Filters , sort , paginated  -------------
  const filtered = users
    .filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase()),
    )
    .filter((u) => (roleFilter ? u.role === roleFilter : true))
    .filter((u) => (statusFilter ? u.status === statusFilter : true));

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;

    const valA = a[sortField];
    const valB = b[sortField];

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);

  const paginated = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const SortableHeader = ({ label, field }) => {
    const isActive = sortField === field;

    return (
      <th
        onClick={() => {
          if (sortField === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
          } else {
            setSortField(field);
            setSortOrder("asc");
          }
        }}
        className="cursor-pointer px-5 py-3.5 hover:bg-bg-surface transition-colors text-left text-xs font-display font-semibold uppercase tracking-wider text-text-secondary group"
      >
        <div className="flex items-center justify-between">
          <span>{label}</span>

          {/* ICON STACK */}
          <div className="flex flex-col leading-none ml-1">
            <ArrowUp
              size={10}
              className={`${
                isActive && sortOrder === "asc"
                  ? "text-primary"
                  : "text-text-muted group-hover:text-text-secondary"
              }`}
            />
            <ArrowDown
              size={10}
              className={`${
                isActive && sortOrder === "desc"
                  ? "text-primary"
                  : "text-text-muted group-hover:text-text-secondary"
              }`}
            />
          </div>
        </div>
      </th>
    );
  };
  // -------------------------------------
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowPass(false);
    setModal("add");
  };

  const openEdit = (user) => {
    setForm({
      username: user.username,
      password: "",
      role: user.role,
    });
    setShowPass(false);
    setChangePassword(false);
    setModal("edit");
  };

  const closeModal = () => {
    setModal(null);
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    try {
      const res = await createUser(form);

      if (res.Status) {
        toast.success("User added");
        fetchUsers();
        closeModal();
      }
    } catch {
      toast.error("Failed to add user");
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        username: form.username,
        role: form.role,
      };

      if (form.password.trim() !== "") {
        payload.password = form.password;
      }

      const res = await updateUser(payload);

      if (res.Status) {
        toast.success("User updated");
        fetchUsers();
        closeModal();
      }
    } catch {
      toast.error("Update failed");
    }
  };
  const handleDelete = async (username) => {
    try {
      const res = await deleteUser(username);

      if (res.Status) {
        toast.success("User deleted");
        fetchUsers();
        setDeleteConfirm(null);
      }
    } catch {
      toast.error("Delete failed");
    }
  };

  /* ─── Role badge colors ─── */
  const roleBadge = (role) => {
    const map = {
      Admin: { color: "var(--color-primary)", bg: "var(--color-primary-50)" },

      Client: { color: "#A0155A", bg: "#FAE8F2" },
      Vendor: {
        color: "var(--color-text-secondary)",
        bg: "var(--color-bg-secondary)",
      },
    };
    return map[role] || map.Admin;
  };

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-secondary">
          User Authentication
        </h2>
        <p className="text-text-secondary text-sm mt-1 font-body">
          Manage user accounts — add, edit, or remove records.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by username or role…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm font-body bg-bg-card text-text-primary
              outline-none placeholder:text-text-muted transition-all"
            style={{ borderColor: "var(--color-border)" }}
            onFocus={(e) =>
              (e.target.style.borderColor = "var(--color-primary)")
            }
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm"
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border text-sm"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="px-3 py-2 rounded-xl border text-sm"
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold
            uppercase tracking-wider text-white transition-all duration-200 active:scale-[0.98] flex-shrink-0"
          style={{ background: "var(--color-primary)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--color-primary-dark)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--color-primary)")
          }
        >
          <Plus size={15} />+ Add User
        </button>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold
    uppercase tracking-wider text-white transition-all duration-200 active:scale-[0.98]"
          style={{ background: "var(--color-secondary)" }}
        >
          Download Excel
        </button>
      </div>

      {/* Table */}
      <div
        className="bg-bg-card rounded-2xl border overflow-hidden"
        style={{ borderColor: "var(--color-border)" }}
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
                <th className="px-5 py-3.5 text-xs">Sr No.</th>

                <SortableHeader label="Username" field="username" />

                <th className="px-5 py-3.5 text-xs">Password</th>

                <SortableHeader label="Role" field="role" />
                <SortableHeader label="Status" field="status" />
                <SortableHeader label="Created" field="createdAt" />

                <th className="px-5 py-3.5 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--color-border)" }}
            >
              <AnimatePresence initial={false}>
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-text-muted font-body text-sm"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((user) => {
                    const rb = roleBadge(user.role);
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="hover:bg-bg-page transition-colors"
                      >
                        <td className="px-5 py-3.5 text-text-muted font-body text-xs">
                          {user.srNo}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-text-primary">
                          {user.username}
                        </td>
                        <td className="px-5 py-3.5 text-text-secondary font-mono text-xs tracking-widest select-none">
                          {"•".repeat(Math.min(user.password.length, 10))}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="px-2.5 py-1 rounded-lg text-xs font-display font-semibold uppercase tracking-wider"
                            style={{ color: rb.color, background: rb.bg }}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-body ${
                              user.status === "Active"
                                ? "bg-[#EAF7F0] text-success"
                                : "bg-bg-surface text-text-muted"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-text-muted text-xs">
                          {user.createdAt}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openEdit(user)}
                              className="p-1.5 rounded-lg hover:bg-bg-surface transition-colors text-text-secondary hover:text-primary"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.username)}
                              className="p-1.5 rounded-lg hover:bg-[#FDEAE3] transition-colors text-text-secondary hover:text-danger"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div
          className="px-5 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-bg)",
          }}
        >
          <span className="text-xs text-text-muted font-body">
            Page {currentPage} of {totalPages} • Showing {paginated.length} of{" "}
            {sorted.length}
          </span>

          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1 rounded border text-xs disabled:opacity-50"
            >
              Prev
            </button>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded border text-xs disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22 }}
              className="relative bg-bg-card rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden"
              style={{ border: "0.5px solid var(--color-border)" }}
            >
              {/* Modal header */}
              <div
                className="flex items-center gap-3 px-6 py-4 border-b"
                style={{ borderColor: "var(--color-border)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--color-primary-50)" }}
                >
                  <UserPlus
                    size={16}
                    style={{ color: "var(--color-primary)" }}
                  />
                </div>
                <h3 className="font-display font-bold text-lg uppercase tracking-wide text-secondary">
                  {modal === "add" ? "Add New User" : "Edit User"}
                </h3>
                <button
                  onClick={closeModal}
                  className="ml-auto p-1.5 rounded-lg hover:bg-bg-surface transition-colors text-text-muted"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={modal === "add" ? handleAdd : handleEdit}
                className="px-6 py-5 space-y-4"
              >
                {/* Username */}
                <div>
                  <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                    Username{" "}
                    <span style={{ color: "var(--color-primary)" }}>*</span>
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, username: e.target.value }))
                    }
                    placeholder="Enter username"
                    className="w-full px-4 py-2.5 rounded-xl border text-sm font-body text-text-primary bg-bg-page
                      outline-none transition-all placeholder:text-text-muted"
                    style={{ borderColor: "var(--color-border)" }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--color-primary)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--color-border)")
                    }
                  />
                </div>
                {/* Password Change Here */}
                {modal === "edit" && !changePassword && (
                  <button
                    type="button"
                    onClick={() => setChangePassword(true)}
                    className="w-full py-2.5 rounded-xl border text-sm font-display font-semibold uppercase tracking-wider
      text-text-secondary hover:bg-bg-surface transition-all"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    Change Password
                  </button>
                )}

                {/* Password */}
                {(modal === "add" || changePassword) && (
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                      Password{" "}
                      <span style={{ color: "var(--color-primary)" }}>*</span>
                    </label>

                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={form.password}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, password: e.target.value }))
                        }
                        placeholder="Enter new password"
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border text-sm font-body text-text-primary bg-bg-page"
                        style={{ borderColor: "var(--color-border)" }}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                )}
                {changePassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setChangePassword(false);
                      setForm((f) => ({ ...f, password: "" }));
                    }}
                    className="text-xs text-text-muted hover:text-danger mt-1"
                  >
                    Cancel password change
                  </button>
                )}

                {/* Role + Status row */}
                <div>
                  <div>
                    <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-1.5">
                      Role
                    </label>
                    <select
                      value={form.role}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, role: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-xl border text-sm font-body text-text-primary bg-bg-page
                        outline-none transition-all appearance-none cursor-pointer"
                      style={{ borderColor: "var(--color-border)" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "var(--color-primary)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "var(--color-border)")
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-display font-semibold uppercase tracking-wider
                      text-text-secondary hover:bg-bg-surface transition-all"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider
                      text-white transition-all active:scale-[0.98]"
                    style={{ background: "var(--color-primary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-primary-dark)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "var(--color-primary)")
                    }
                  >
                    {modal === "add" ? "Add User" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm Modal ─── */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-bg-card rounded-2xl shadow-xl w-full max-w-sm z-10 p-6 text-center"
              style={{ border: "0.5px solid var(--color-border)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--color-primary-50)" }}
              >
                <Trash2 size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <h4 className="font-display font-bold text-xl uppercase tracking-wide text-secondary mb-2">
                Delete User
              </h4>
              <p className="text-text-secondary text-sm font-body mb-6">
                This action cannot be undone. Are you sure you want to delete
                this user?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-display font-semibold uppercase tracking-wider
                    text-text-secondary hover:bg-bg-surface transition-all"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all"
                  style={{ background: "var(--color-error)" }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
