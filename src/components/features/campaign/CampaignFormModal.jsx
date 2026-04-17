import { X, Loader2 } from "lucide-react";
import Select from "react-select";

export default function CampaignFormModal({ mode, form, setForm, users, submitting, onSubmit, onClose }) {
  const isEdit = mode === "edit";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h3 className="font-display font-bold text-lg uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
            {isEdit ? "Edit Campaign" : "New Campaign"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit}>
          <div className="px-6 py-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
            <Field label="Campaign Name" required>
              <input name="name" placeholder="e.g. Summer Giveaway 2025" value={form.name} onChange={handleChange} required />
            </Field>

            <Field label="Description">
              <textarea name="description" placeholder="Brief description…" value={form.description} onChange={handleChange} rows={2} style={{ resize: "none" }} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Start Date" required>
                <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
              </Field>
              <Field label="End Date" required>
                <input type="date" name="endDate" value={form.endDate} onChange={handleChange} required />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="State" required>
                <input name="state" placeholder="e.g. Maharashtra" value={form.state} onChange={handleChange} required />
              </Field>
              <Field label="Number of Walls" required>
                <input type="number" name="walls" placeholder="0" min="0" value={form.walls} onChange={handleChange} required />
              </Field>
            </div>

            <Field label="Assign Users">
              <Select
                options={users}
                isMulti
                value={users.filter(u => form.assignedUsers.includes(u.value))}
                placeholder="Search and select users…"
                onChange={selected => {
                  setForm(prev => ({ ...prev, assignedUsers: selected.map(s => s.value) }));
                }}
                styles={selectStyles}
                className="text-sm"
              />
            </Field>
          </div>

          {/* Footer */}
          <div
            className="flex justify-end gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              style={{ background: "var(--color-primary)" }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? "Save Changes" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  const inputClass = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all font-body";
  const inputStyle = {
    background: "var(--color-bg)",
    color: "var(--color-text-primary)",
    borderColor: "var(--color-border)",
  };

  return (
    <div>
      <label className="block text-xs font-display font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
        {label}{required && <span className="ml-0.5 opacity-60">*</span>}
      </label>
      <div>
        {React_cloneWithStyles(children, inputClass, inputStyle)}
      </div>
    </div>
  );
}

// Helper to apply consistent styles to form inputs
function React_cloneWithStyles(children, className, style) {
  if (!children) return null;
  // For Select component, don't apply input styles
  if (children.type && children.type.name === "Select") return children;
  if (children.type && children.type.displayName && children.type.displayName.includes("Select")) return children;

  const existingClass = children.props.className || "";
  return {
    ...children,
    props: {
      ...children.props,
      className: `${className} ${existingClass}`,
      style: { ...style, ...children.props.style },
      onFocus: (e) => {
        e.target.style.borderColor = "var(--color-primary)";
        children.props.onFocus?.(e);
      },
      onBlur: (e) => {
        e.target.style.borderColor = "var(--color-border)";
        children.props.onBlur?.(e);
      },
    },
  };
}

const selectStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: "var(--color-bg)",
    borderColor: state.isFocused ? "var(--color-primary)" : "var(--color-border)",
    borderRadius: "12px",
    minHeight: "42px",
    boxShadow: "none",
    "&:hover": { borderColor: "var(--color-primary)" },
  }),
  menu: (base) => ({
    ...base,
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "12px",
    overflow: "hidden",
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "var(--color-primary)"
      : state.isFocused
      ? "color-mix(in srgb, var(--color-primary) 10%, transparent)"
      : "transparent",
    color: state.isSelected ? "white" : "var(--color-text-primary)",
    fontSize: "13px",
  }),
  multiValue: (base) => ({
    ...base,
    backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
    borderRadius: "8px",
  }),
  multiValueLabel: (base) => ({
    ...base,
    color: "var(--color-primary)",
    fontSize: "12px",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--color-primary)",
    borderRadius: "0 8px 8px 0",
    "&:hover": { background: "var(--color-primary)", color: "white" },
  }),
  input: (base) => ({ ...base, color: "var(--color-text-primary)" }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-muted)", fontSize: "13px" }),
  singleValue: (base) => ({ ...base, color: "var(--color-text-primary)" }),
};
