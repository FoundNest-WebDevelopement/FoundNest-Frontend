export const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { key: "special", label: "At least one special character", test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
];

export function isPasswordStrong(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
