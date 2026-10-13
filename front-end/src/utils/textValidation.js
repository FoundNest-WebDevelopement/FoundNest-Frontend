// Shared sanitization/validation for free-text report fields (item name,
// description, contents, etc.) across the user report form and the admin
// lost/found report modals, so all of them enforce the same rules.

export const sanitizeText = (value, maxLength) =>
  String(value ?? "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .slice(0, maxLength);

export const minLengthMessage = (min) => `Please add more detail (at least ${min} characters)`;

export function validateMinLength(value, min) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "This field is required.";
  if (trimmed.length < min) return minLengthMessage(min);
  return "";
}
