import { onlyDigits } from "../../../utils/phone";

// +91 mobile input: numeric keypad on phones, digits only, max 10.
export default function PhoneField({ value, onChange, error, autoFocus, inputRef, label = "Mobile Number" }) {
  return (
    <div>
      <label className="block text-xs font-display font-semibold uppercase tracking-widest text-text-secondary mb-2">
        {label}
      </label>
      <div
        className={`flex items-stretch rounded-xl border bg-bg-page overflow-hidden transition-colors focus-within:border-primary ${
          error ? "border-danger" : "border-[color:var(--color-border)]"
        }`}
      >
        <span className="px-3 flex items-center text-sm font-semibold text-text-secondary border-r border-[color:var(--color-border)] select-none">
          +91
        </span>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          name="username"
          maxLength={10}
          value={value}
          onChange={(e) => onChange(onlyDigits(e.target.value))}
          placeholder="10-digit mobile number"
          autoFocus={autoFocus}
          className="flex-1 min-w-0 px-3 py-3 text-sm font-body text-text-primary bg-transparent outline-none placeholder:text-text-muted tracking-wide"
        />
      </div>
      {error && <p className="text-xs mt-1.5 text-danger">{error}</p>}
    </div>
  );
}
