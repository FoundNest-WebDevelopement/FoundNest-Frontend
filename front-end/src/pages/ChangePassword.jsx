import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertDialog from "../components/AlertDialog";
import PasswordChecklist from "../user-native/PasswordChecklist";
import StackHeader from "../user-native/StackHeader";
import Icon from "../user-native/Icon";
import { isPasswordStrong } from "../utils/passwordRules";
import { changePassword } from "../utils/authApi";

function PasswordField({ label, value, onChange, show, onToggle, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[15px] font-bold text-[#1a1a1a]">{label}</p>
      <div
        className={`flex items-center bg-white rounded-xl px-3.5 h-14 border ${
          error ? "border-[1.5px] border-[#C0392B]" : "border-[#D6D6D6]"
        }`}
      >
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label={label}
          className="flex-1 min-w-0 text-[16px] text-[#1a1a1a] bg-transparent outline-none p-0"
        />
        <button type="button" onClick={onToggle} aria-label={show ? "Hide password" : "Show password"} className="flex">
          <Icon name={show ? "eye-outline" : "eye-off-outline"} size={20} color="#B0B0B0" />
        </button>
      </div>
      {error ? <p className="text-[13px] text-[#C0392B] mt-0.5 ml-1">{error}</p> : null}
      {children}
    </div>
  );
}

export default function ChangePassword({ onBack }) {
  const user_id = localStorage.getItem("user_id");
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [currentError, setCurrentError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  // "leave" = back arrow (also navigates away), "cancel" = Cancel button (only clears the form)
  const [discardMode, setDiscardMode] = useState("leave");

  const hasChanges = currentPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;
  const isFormFilled =
    currentPassword.trim().length > 0 && newPassword.trim().length > 0 && confirmPassword.trim().length > 0;
  const isNewPasswordValid = isPasswordStrong(newPassword);
  const isConfirmMismatched = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const isFormValid = isFormFilled && isNewPasswordValid && !isConfirmMismatched;

  const confirmError = isConfirmMismatched ? "Passwords do not match." : "";

  const handleSubmit = async () => {
    if (!isFormValid || loading) return;
    setShowConfirmDialog(false);
    setError("");
    setCurrentError("");
    setLoading(true);
    try {
      await changePassword(user_id, currentPassword, newPassword);

      // The server ends every session on a password change, so sign out
      // locally and send the user to log in again (same as the mobile app).
      const rememberedEmail = localStorage.getItem("remembered_email");
      localStorage.clear();
      if (rememberedEmail) localStorage.setItem("remembered_email", rememberedEmail);
      navigate("/login?notice=password_changed", { replace: true });
    } catch (err) {
      if (err.status === 401) {
        setCurrentError(err.message || "Current password is incorrect.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentError("");
    setError("");
  };

  const requestLeave = () => {
    if (!hasChanges) return onBack();
    setDiscardMode("leave");
    setShowDiscard(true);
  };

  return (
    <div className="narrow-body bg-[#FFF1E0] min-h-[calc(100vh-70px)] lg:min-h-screen">
      <StackHeader title="Change Password" onBack={requestLeave} />

      <div className="pb-10">
        <div className="bg-white mx-4 mt-5 rounded-3xl px-[18px] pt-5 pb-5 flex flex-col gap-[18px]">
          <PasswordField
            label="Current Password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              setError("");
              setCurrentError("");
            }}
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            error={currentError}
          />

          <PasswordField
            label="New Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError("");
            }}
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
          >
            {newPassword.length > 0 && <PasswordChecklist password={newPassword} />}
          </PasswordField>

          <PasswordField
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            error={confirmError}
          />

          {error && <p className="text-[13px] text-[#C0392B] ml-1">{error}</p>}

          <div className="mt-1 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmDialog(true)}
              disabled={!isFormValid || loading}
              className={`bg-primary rounded-xl h-[52px] flex items-center justify-center text-[16px] font-bold text-white active:opacity-80 ${
                !isFormValid ? "opacity-45" : ""
              }`}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Change Password"
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!hasChanges) return;
                setDiscardMode("cancel");
                setShowDiscard(true);
              }}
              disabled={!hasChanges}
              className={`rounded-xl h-[52px] border border-primary flex items-center justify-center text-[16px] font-semibold active:opacity-80 ${
                hasChanges ? "text-primary" : "text-primary/30 opacity-45"
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <AlertDialog
          message="Changing your password will log you out of this device. Are you sure you want to continue?"
          b1Label="Cancel"
          b2Label="Change Password"
          b1OnClick={() => setShowConfirmDialog(false)}
          b2OnClick={handleSubmit}
        />
      )}

      {showDiscard && (
        <AlertDialog
          message="Discard changes? Unsaved edits will be lost."
          b1Label="Keep Editing"
          b2Label="Discard"
          b1OnClick={() => setShowDiscard(false)}
          b2OnClick={() => {
            setShowDiscard(false);
            reset();
            if (discardMode === "leave") onBack();
          }}
        />
      )}
    </div>
  );
}
