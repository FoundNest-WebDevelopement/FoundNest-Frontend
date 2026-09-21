import { useState } from "react";
import { TriangleAlert, Mail, KeyRound, AtSign } from "lucide-react";
import { toast } from "react-toastify";
import { adminSendResetOTP, adminVerifyOTPAndResetPassword, superAdminSendOTP, superAdminVerifyOTPAndResetPassword } from "../utils/authApi";

const STEPS = [
  { key: "email", label: "Email" },
  { key: "send", label: "Send OTP" },
  { key: "verify", label: "Verify & Reset" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ResetPasswordModal({ user, onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  const fullName = user.first_name
    ? `${user.first_name} ${user.last_name}`
    : "this user";

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  const handleClose = () => {
    setStep("email");
    setEmail("");
    setOtp("");
    setError("");
    onClose();
  };

  // STEP 1 -> STEP 2: validate the typed email, then move on
  const handleEmailNext = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError("Please enter an email address.");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setEmail(trimmed);
    setError("");
    setStep("send");
  };

  // STEP 2: send the OTP to the email entered in step 1
  const handleSendOTP = async () => {
    try {
      setIsSending(true);
      setError("");
      await superAdminSendOTP(user.user_id, email);
      toast.success(`OTP sent to ${email}.`);
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  // STEP 3: verify OTP and reset the password
  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    try {
      setIsVerifying(true);
      setError("");
      await superAdminVerifyOTPAndResetPassword(user.user_id, otp, email);
      toast.success(`Password reset. Temporary password sent to ${email}.`);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const ErrorMessage = () =>
    error ? (
      <p className="text-xs text-[#C0392B] flex items-center gap-1">
        <TriangleAlert size={12} /> {error}
      </p>
    ) : null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-1040"
      onClick={() => !isSending && !isVerifying && handleClose()}
    >
      <div
        className="relative bg-white rounded-lg w-100 max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
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
            {STEPS.map((s, i) => {
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 text-xs font-medium whitespace-nowrap
                      ${isCurrent ? "text-primary" : isDone ? "text-green-600" : "text-[#DDD9CF]"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                        ${isCurrent ? "bg-primary" : isDone ? "bg-green-600" : "bg-[#DDD9CF]"}`}
                    >
                      {isDone ? "✓" : i + 1}
                    </div>
                    {s.label}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-4 h-px bg-[#DDD9CF]" />
                  )}
                </div>
              );
            })}
          </div>

          <hr className="border-[#DDD9CF] opacity-50" />

          {/* STEP 1 — Enter email */}
          {step === "email" && (
            <>
              <div className="flex justify-center">
                <div className="bg-[#F9ECEC] p-3 rounded-full">
                  <AtSign size={32} className="text-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-center">
                <p className="text-sm font-semibold">Enter Email Address</p>
                <p className="text-xs text-[#6B5C42]">
                  Enter the email where the OTP and temporary password for{" "}
                  <span className="font-medium">{fullName}</span> will be sent.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B5C42]">Email</label>
                <input
                  type="email"
                  autoFocus
                  placeholder="e.g. name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailNext()}
                  className="w-full border border-[#DDD9CF] rounded-md px-3 py-2 text-sm
                    outline-none focus:border-primary"
                />
              </div>

              <ErrorMessage />

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
                  onClick={handleEmailNext}
                  disabled={!email.trim()}
                  className="flex-1 h-10 bg-primary rounded-lg text-white text-sm font-medium
                    transition-transform duration-100 enabled:active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* STEP 2 — Confirm email & send OTP */}
          {step === "send" && (
            <>
              <div className="flex justify-center">
                <div className="bg-[#F9ECEC] p-3 rounded-full">
                  <Mail size={32} className="text-primary" />
                </div>
              </div>

              <div className="flex flex-col gap-1 text-center">
                <p className="text-sm font-semibold">Send OTP</p>
                <p className="text-xs text-[#6B5C42]">
                  An OTP will be sent to{" "}
                  <span className="font-medium text-primary">{email}</span>.
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

              <ErrorMessage />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); }}
                  disabled={isSending}
                  className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary
                    text-sm font-medium transition-transform duration-100 enabled:active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Change Email
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

          {/* STEP 3 — Verify OTP & reset */}
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
                  Ask <span className="font-medium">{fullName}</span> to check{" "}
                  <span className="font-medium text-primary">{email}</span> and share
                  the 6-digit code with you.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6B5C42]">OTP Code</label>
                <input
                  type="text"
                  inputMode="numeric"
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
                  and emailed to <span className="font-medium">{email}</span>.
                </p>
              </div>

              <ErrorMessage />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("send"); setError(""); setOtp(""); }}
                  disabled={isVerifying}
                  className="flex-1 h-10 bg-white border border-primary rounded-lg text-primary
                    text-sm font-medium transition-transform duration-100 enabled:active:scale-95
                    disabled:opacity-40 disabled:cursor-not-allowed"
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