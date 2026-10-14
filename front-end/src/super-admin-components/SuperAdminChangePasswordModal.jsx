import { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, X } from "lucide-react";
import { changePassword } from "../utils/authApi";
import PasswordChecklist from "../components/PasswordChecklist";
import { isPasswordStrong } from "../utils/passwordRules";

export default function SuperAdminChangePasswordModal({ userId, onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isFormValid =
    currentPassword !== "" &&
    isPasswordStrong(newPassword) &&
    confirmPassword !== "" &&
    newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isFormValid || isSaving) return;
    setError("");
    setIsSaving(true);
    try {
      await changePassword(userId, currentPassword, newPassword);
      setIsSuccess(true);
      window.setTimeout(onClose, 1500);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const passwordInput = (label, value, setValue, isVisible, toggleVisibility) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative">
        <input
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
          }}
          autoComplete={label === "Current Password" ? "current-password" : "new-password"}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary transition-colors"
        />
        <button
          type="button"
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          onClick={toggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
        >
          {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[1040] flex items-center justify-center bg-black/40"
      onClick={() => !isSaving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="super-admin-change-password-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p id="super-admin-change-password-title" className="font-semibold text-[#1A1208] text-base">
            Change Password
          </p>
          <button
            type="button"
            onClick={() => !isSaving && onClose()}
            aria-label="Close change password dialog"
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <p className="text-sm text-green-600 text-center py-4">Password changed successfully.</p>
        ) : (
          <>
            {passwordInput("Current Password", currentPassword, setCurrentPassword, showCurrentPassword, () => setShowCurrentPassword((value) => !value))}
            {passwordInput("New Password", newPassword, setNewPassword, showNewPassword, () => setShowNewPassword((value) => !value))}

            {newPassword.length > 0 && !isPasswordStrong(newPassword) && (
              <div className="bg-gray-50 rounded-lg px-3 py-2.5">
                <PasswordChecklist password={newPassword} variant="light" />
              </div>
            )}

            {passwordInput("Confirm New Password", confirmPassword, setConfirmPassword, showConfirmPassword, () => setShowConfirmPassword((value) => !value))}
            {confirmPassword && confirmPassword !== newPassword && (
              <p className="-mt-3 text-xs text-red-500">Passwords do not match.</p>
            )}
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || isSaving}
              className="w-full bg-primary text-white rounded-lg py-3 text-sm font-semibold hover:opacity-90 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
