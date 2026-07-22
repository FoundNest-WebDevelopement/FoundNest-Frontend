
import { fetchWithAuth } from "./fetchWithAuth";
const API_URL = import.meta.env.VITE_API_URL;

export const adminSendResetOTP = async (userId) => {
  const response = await fetchWithAuth(
    `${API_URL}/api/auth/admin/reset-password/send-otp/${userId}`,
    { method: "POST" }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to send OTP.");
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