import { useState } from "react";
import { Lock, TriangleAlert, Mail, KeyRound } from "lucide-react";
import { toast } from "react-toastify";
import { adminSendResetOTP, adminVerifyOTPAndResetPassword } from "../utils/authApi";

export default function ResetPasswordModal({ user, onClose }) {
  const [step, setStep] = useState("send"); 
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const fullName = user.first_name
    ? `${user.first_name} ${user.last_name}`
    : "this user";

  const handleClose = () => {
    setStep("send");
    setOtp("");
    setError("");
    onClose();
  };

  const handleSendOTP = async () => {
    try {
      setIsSending(true);
      setError("");
      await adminSendResetOTP(user.user_id);
      toast.success("OTP sent to user's email.");
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    try {
      setIsVerifying(true);
      setError("");
     await adminVerifyOTPAndResetPassword(user.user_id, otp);
      toast.success("Password reset. Temporary password sent to user's email.");
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040">
      <div className="relative bg-white rounded-lg w-100 max-w-[90vw]">

        {/* Header */}
        <div className="w-full h-10 rounded-t-lg bg-primary text-white flex items-center justify-between px-5">
          <p className="font-semibold">Reset Password</p>
          <button onClick={handleClose}>
            <i className="fa-solid fa-x text-sm text-white" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">

          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center">
            <div className={`flex items-center gap-1 text-xs font-medium
              ${step === "send" ? "text-primary" : "text-green-600"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${step === "send" ? "bg-primary text-white" : "bg-green-600 text-white"}`}>
                {step === "verify" ? "✓" : "1"}
              </div>
              Send OTP
            </div>
            <div className="flex-1 h-px bg-[#DDD9CF]" />
            <div className={`flex items-center gap-1 text-xs font-medium
              ${step === "verify" ? "text-primary" : "text-[#DDD9CF]"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${step === "verify" ? "bg-primary text-white" : "bg-[#DDD9CF] text-white"}`}>
                2
              </div>
              Verify & Reset
            </div>
          </div>

          <hr className="border-[#DDD9CF] opacity-50" />

          {/* STEP 1 — Send OTP */}
          {step === "send" && (
            <>
              <div className="flex justify-center">
                <div className="bg-[#F9ECEC] p-3 rounded-full">
                  <Mail size={32} className="text-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-center">
                <p className="text-sm font-semibold">Send OTP to User</p>
                <p className="text-xs text-[#6B5C42]">
                  An OTP will be sent to{" "}
                  <span className="font-medium text-primary">{user.email}</span>.
                  Ask the user to share the code with you after receiving it.
                </p>
              </div>

              <div className="bg-[#FFF3E0] border border-[#E65100]/30 rounded-md p-3 flex gap-2">
                <TriangleAlert size={14} className="text-[#E65100] mt-0.5 shrink-0" />
                <p className="text-xs text-[#E65100]">
                  The user's current password will be replaced by a system-generated
                  temporary password after verification.
                </p>
              </div>

              {error && (
                <p className="text-xs text-[#C0392B] flex items-center gap-1">
                  <TriangleAlert size={12} /> {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary
                    text-sm font-medium transition-transform duration-100 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isSending}
                  className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                    transition-transform duration-100 enabled:active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSending ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </>
          )}

    
          {step === "verify" && (
            <>
              <div className="flex justify-center">
                <div className="bg-[#F9ECEC] p-3 rounded-full">
                  <KeyRound size={32} className="text-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-center">
                <p className="text-sm font-semibold">Enter the OTP</p>
                <p className="text-xs text-[#6B5C42]">
                  Ask <span className="font-medium">{fullName}</span> to check their
                  email and share the 6-digit code with you.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B5C42]">OTP Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 483920"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "")); 
                    setError("");
                  }}
                  className="w-full border border-[#DDD9CF] rounded-md px-3 py-2 text-sm
                    outline-none focus:border-primary tracking-[0.4em] text-center font-mono"
                />
              </div>

              <div className="bg-[#E6F1FB] border border-[#2980B9]/30 rounded-md p-3">
                <p className="text-xs text-[#2980B9]">
                  Once verified, a temporary password will be automatically generated
                  and emailed to <span className="font-medium">{user.email}</span>.
                </p>
              </div>

              {error && (
                <p className="text-xs text-[#C0392B] flex items-center gap-1">
                  <TriangleAlert size={12} /> {error}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("send"); setError(""); setOtp(""); }}
                  className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary
                    text-sm font-medium transition-transform duration-100 active:scale-95"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying || otp.length !== 6}
                  className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                    transition-transform duration-100 enabled:active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isVerifying ? "Verifying..." : "Verify & Reset"}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}