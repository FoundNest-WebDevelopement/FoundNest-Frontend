
import { fetchWithAuth } from "./fetchWithAuth";
const API_URL = import.meta.env.VITE_API_URL;

// Error carrying what the reset-password screens need to react to rate limits:
// the HTTP status, the server's error code and the Retry-After wait (seconds).
const buildAuthError = (response, data, fallback) => {
  const error = new Error(data.message || fallback);
  error.status = response.status;
  error.code = data.code;
  const retryAfter = Number(response.headers.get("Retry-After"));
  error.retryAfter = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.ceil(retryAfter) : null;
  return error;
};

export const forgotPassword = async (email) => {
  const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw buildAuthError(response, data, "Failed to send verification code.");
  return data;
};

export const verifyResetOTP = async (email, otp) => {
  const response = await fetch(`${API_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw buildAuthError(response, data, "Invalid or expired code.");
  return data;
};

export const resetPassword = async (resetToken, newPassword) => {
  const response = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resetToken, newPassword }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw buildAuthError(response, data, "Failed to reset password.");
  return data;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const response = await fetchWithAuth(
    `${API_URL}/api/profile/${userId}/change-password`,
    {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    // status lets callers tell a wrong current password (401) from other failures
    const error = new Error(data.message || "Failed to change password.");
    error.status = response.status;
    throw error;
  }
  return data;
};

export const adminSendResetOTP = async (userId) => {
  const response = await fetchWithAuth(
    `${API_URL}/api/auth/admin/reset-password/send-otp/${userId}`,
    { method: "POST" }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send OTP.");
  return data;
};

export const superAdminSendOTP = async ({ user_id, email }) => {
  const res = await fetchWithAuth(`${API_URL}/api/auth/super-admin-send-otp`, {
    method: "POST",
    body: JSON.stringify({ user_id, email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
  return data;
};

export const adminVerifyOTPAndResetPassword = async (userId, otp) => {
  const response = await fetchWithAuth(
    `${API_URL}/api/auth/admin/reset-password/${userId}`,
    {
      method: "PUT",
      body: JSON.stringify({ otp }),
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to reset password.");
  return data;
};

export const superAdminVerifyOTPAndResetPassword = async (userId, otp, email) => {
  const res = await fetchWithAuth(`${API_URL}/api/auth/super-admin-verify-otp`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, otp, email }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to reset password.");
  return data;
};