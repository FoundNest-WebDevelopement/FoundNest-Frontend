import { PASSWORD_RULES } from "../utils/passwordRules";

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#4ADE80" />
    <path d="M7.5 12.5l3 3 6-6.5" stroke="#1A3D1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const WarningIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="11" fill="#F9E055" />
    <rect x="11" y="6" width="2" height="7" rx="1" fill="#7A5B00" />
    <rect x="11" y="15.5" width="2" height="2" rx="1" fill="#7A5B00" />
  </svg>
);

const COLORS = {
  dark: { passed: "#4ADE80", unmet: "#F9E055" },
  light: { passed: "#15803D", unmet: "#B45309" },
};

export default function PasswordChecklist({ password, variant = "dark" }) {
  const colors = COLORS[variant] || COLORS.dark;
  return (
    <div className="flex flex-col gap-1.5">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <div key={rule.key} className="flex items-center gap-2">
            {passed ? <CheckIcon /> : <WarningIcon />}
            <span
              className="text-xs font-medium"
              style={{ color: passed ? colors.passed : colors.unmet }}
            >
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
