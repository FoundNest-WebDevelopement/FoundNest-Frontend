import { useState } from "react";
import PasswordChecklist from "../components/PasswordChecklist";
import { isPasswordStrong } from "../utils/passwordRules";
import { changePassword } from "../utils/authApi";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const BackHeader = ({ title, onBackPress }) => (
  <div className="bg-[#990000] px-5 py-4 rounded-b-xl flex items-center gap-3">
    <button onClick={onBackPress} style={{ cursor: "pointer" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
    </button>
    <p className="text-white font-bold text-lg">{title}</p>
  </div>
);

export default function ChangePassword({ onBack }) {
  const user_id = localStorage.getItem("user_id");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isFormValid =
    currentPassword !== "" &&
    isPasswordStrong(newPassword) &&
    confirmPassword !== "" &&
    newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isFormValid || loading) return;
    setError("");
    setLoading(true);
    try {
      await changePassword(user_id, currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen mt-13 mb-16" style={{ backgroundColor: "#FFF3E0" }}>
      <BackHeader title="Change Password" onBackPress={onBack} />

      <div className="px-5 py-5 flex flex-col gap-4">
        <div>
          <p className="text-xs text-[#4B2D23] font-medium mb-1">Current Password</p>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-white rounded-lg px-4 py-3 pr-11 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ cursor: "pointer" }}
            >
              {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-[#4B2D23] font-medium mb-1">New Password</p>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-white rounded-lg px-4 py-3 pr-11 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ cursor: "pointer" }}
            >
              {showNew ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className="bg-[#990000] rounded-lg px-4 py-3">
          <PasswordChecklist password={newPassword} />
        </div>

        <div>
          <p className="text-xs text-[#4B2D23] font-medium mb-1">Confirm New Password</p>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              className="w-full bg-white rounded-lg px-4 py-3 pr-11 text-sm text-[#4B2D23] outline-none border border-transparent focus:border-[#990000]"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ cursor: "pointer" }}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {confirmPassword !== "" && confirmPassword !== newPassword && (
            <p className="text-[#990000] text-xs mt-1">Passwords do not match.</p>
          )}
        </div>

        {error && <p className="text-[#990000] text-xs text-center">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="w-full py-3 rounded-lg text-sm font-semibold mt-2"
          style={{
            backgroundColor: isFormValid && !loading ? "#990000" : "rgba(153, 0, 0, 0.3)",
            color: "white",
            cursor: isFormValid && !loading ? "pointer" : "default",
          }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {showSuccessToast && (
        <div className="fixed bottom-20 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#990000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            Password changed successfully.
          </p>
        </div>
      )}
    </div>
  );
}
