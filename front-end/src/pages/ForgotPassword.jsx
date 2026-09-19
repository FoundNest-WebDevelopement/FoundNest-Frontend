import { useNavigate } from "react-router-dom";
import amico from "../assets/amico.png";
import logowhite from "../assets/logowhite.png";
import bsu from "../assets/bsu.jpg";
import { useState, useEffect } from "react";
import { forgotPassword, verifyResetOTP, resetPassword } from "../utils/authApi";
import PasswordChecklist from "../components/PasswordChecklist";
import { isPasswordStrong } from "../utils/passwordRules";

const RESEND_COOLDOWN_SECONDS = 60;

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

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const isStep1Valid = email.trim() !== "";
  const isStep2Valid = code.join("").length === 6;
  const isStep3Valid =
    isPasswordStrong(newPassword) &&
    confirmPassword !== "" &&
    newPassword === confirmPassword;

  const actionButtonStyle = (isActive) => ({
    backgroundColor: isActive ? "#FFEFEF" : "rgba(255, 243, 224, 0.7)",
    color: isActive ? "#990000" : "rgba(75, 45, 35, 0.7)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: isActive ? "pointer" : "default",
  });

  const backButtonStyle = {
    backgroundColor: "transparent",
    color: "#FFEFEF",
    border: "1.5px solid #FFEFEF",
    borderRadius: "6px",
    padding: "8px 24px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  };

  const desktopPrimaryButtonStyle = (isActive) => ({
    height: "48px",
    backgroundColor: isActive ? "#990000" : "rgba(153,0,0,.30)",
    color: "white",
    cursor: isActive ? "pointer" : "default",
    boxShadow: "0 4px 10px rgba(0,0,0,.18)",
  });

  const desktopBackButtonStyle = {
    height: "48px",
    backgroundColor: "transparent",
    color: "#990000",
    border: "1.5px solid #990000",
    cursor: "pointer",
  };

  const handleSendCode = async () => {
    if (!isStep1Valid || loading) return;
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setCode(["", "", "", "", "", ""]);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep(2);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setCode(["", "", "", "", "", ""]);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isStep2Valid || loading) return;
    setError("");
    setLoading(true);
    try {
      const data = await verifyResetOTP(email.trim(), code.join(""));
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!isStep3Valid || loading) return;
    setError("");
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      navigate("/login");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) handleSendCode();
    else if (step === 2) handleVerifyCode();
    else if (step === 3) handleResetPassword();
  };

  const handleCodeChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  const handleCodeChangeDesktop = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");
    if (value && index < 5) {
      document.getElementById(`code-desktop-${index + 1}`).focus();
    }
  };

  // ── DESKTOP LAYOUT (md and above) ────────────────────────────────────────
  const DesktopForgotPassword = (
    <div
      className="hidden md:flex h-screen w-screen items-center justify-center"
      style={{ position: "relative", overflow: "hidden" }}
    >
      {/* Background Image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${bsu})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* Red Transparent Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 85% 10%, rgba(255,91,91,.30) 0%, rgba(225,27,27,.45) 28%, rgba(179,0,0,.60) 65%, rgba(146,0,0,.75) 100%)",
          zIndex: 1,
        }}
      />

      <div
        className="bg-white rounded-2xl shadow-2xl overflow-hidden flex"
        style={{
          width: "980px",
          height: "560px",
          boxShadow: "0 15px 45px rgba(0,0,0,.20)",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Left — Form Side */}
        <div
          className="bg-white flex flex-col justify-center relative"
          style={{ width: "54%", paddingLeft: "58px", paddingRight: "58px" }}
        >
          <button
            onClick={() => navigate("/login")}
            className="absolute top-6 left-6 w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            style={{ backgroundColor: "#F0F0F0", cursor: "pointer" }}
          >
            <span className="text-[#333333] text-lg font-bold">←</span>
          </button>

          {/* Step 1 - Enter Email */}
          {step === 1 && (
            <>
              <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#161616", marginBottom: "8px" }}>
                Forgot Password
              </h1>
              <p className="text-sm text-[#777] mb-6">
                Please enter your email address and we'll send you a verification code.
              </p>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="w-full border border-[#d8d8d8] bg-white outline-none"
                style={{ height: "52px", padding: "0 15px", fontSize: "15px", marginBottom: "18px" }}
              />
              {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}
              <button
                onClick={handleNext}
                disabled={!isStep1Valid || loading}
                className="w-full text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
                style={desktopPrimaryButtonStyle(isStep1Valid && !loading)}
              >
                {loading ? "Sending..." : "Next"}
              </button>
            </>
          )}

          {/* Step 2 - Verification Code */}
          {step === 2 && (
            <>
              <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#161616", marginBottom: "8px" }}>
                Enter Verification Code
              </h1>
              <p className="text-sm text-[#777] mb-6">
                We've sent a verification code to{" "}
                <span className="font-semibold text-[#333]">{email}</span>
              </p>
              <div className="flex justify-between gap-2 mb-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-desktop-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChangeDesktop(e.target.value, index)}
                    className="text-center text-lg font-bold bg-white outline-none border border-[#d8d8d8] focus:border-[#990000] transition-all"
                    style={{ width: "48px", height: "56px" }}
                  />
                ))}
              </div>
              {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}
              <p className="text-sm text-[#777] mb-6">
                Didn't receive the code?{" "}
                <span
                  onClick={handleResend}
                  className="text-[#990000] font-medium cursor-pointer"
                  style={{ opacity: resendCooldown > 0 || loading ? 0.5 : 1 }}
                >
                  {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
                </span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  className="flex-1 text-sm font-semibold cursor-pointer"
                  style={desktopBackButtonStyle}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStep2Valid || loading}
                  className="flex-1 text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
                  style={desktopPrimaryButtonStyle(isStep2Valid && !loading)}
                >
                  {loading ? "Verifying..." : "Next"}
                </button>
              </div>
            </>
          )}

          {/* Step 3 - Set New Password */}
          {step === 3 && (
            <>
              <h1 style={{ fontSize: "26px", fontWeight: 600, color: "#161616", marginBottom: "8px" }}>
                Set New Password
              </h1>
              <p className="text-sm text-[#777] mb-4">
                Password must contain an uppercase letter, a special character, and a number.
              </p>
              <div className="relative mb-3">
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full border border-[#d8d8d8] bg-white outline-none"
                  style={{ height: "52px", paddingLeft: "15px", paddingRight: "45px", fontSize: "15px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ cursor: "pointer" }}
                >
                  {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>

              <div className="bg-[#FFF3E0] rounded-md px-4 py-3 mb-3">
                <PasswordChecklist password={newPassword} variant="light" />
              </div>

              <div className="relative mb-2">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className="w-full border border-[#d8d8d8] bg-white outline-none"
                  style={{ height: "52px", paddingLeft: "15px", paddingRight: "45px", fontSize: "15px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ cursor: "pointer" }}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPassword !== "" && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 mb-2">Passwords do not match.</p>
              )}
              {error && <p className="text-xs text-red-500 text-center mb-2">{error}</p>}

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => { setStep(2); setError(""); }}
                  className="flex-1 text-sm font-semibold cursor-pointer"
                  style={desktopBackButtonStyle}
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={!isStep3Valid || loading}
                  className="flex-1 text-sm font-semibold transition-all active:scale-95 cursor-pointer disabled:cursor-default"
                  style={desktopPrimaryButtonStyle(isStep3Valid && !loading)}
                >
                  {loading ? "Saving..." : "Done"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right — Brand Card */}
        <div
          className="flex flex-col items-center justify-center"
          style={{
            width: "48%",
            margin: "14px",
            borderRadius: "12px",
            background:
              "radial-gradient(circle at 85% 10%, #ff5b5b 0%, #e11b1b 28%, #b30000 65%, #920000 100%)",
            paddingTop: "55px",
            paddingBottom: "45px",
            paddingLeft: "40px",
            paddingRight: "40px",
          }}
        >
          <div className="flex flex-col items-center">
            <img src={logowhite} alt="FoundNest" className="w-52 h-52 object-contain" />
            <p className="text-white text-[25px] font-bold mt-2">FoundNest</p>
          </div>
          <p className="text-white text-sm text-center leading-6 opacity-90">
            A Lost &amp; Found Management System
            <br />
            for Bulacan State University.
          </p>
        </div>
      </div>
    </div>
  );

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────
  const MobileForgotPassword = (
    <div className="flex md:hidden flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden relative">
        <button
          onClick={() => navigate("/login")}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#D9D9D9", cursor: "pointer" }}
        >
          <span className="text-[#333333] text-lg font-bold">←</span>
        </button>
        <img
          src={amico}
          alt="Forgot Password Illustration"
          className="w-4/5 h-4/5 object-contain object-center"
        />
      </div>

      <div
        className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-4"
        style={{ minHeight: "45%" }}
      >
        {/* Step 1 - Enter Email */}
        {step === 1 && (
          <>
            <h1 className="text-white text-2xl font-semibold text-center">
              Forgot Password
            </h1>
            <p className="text-white text-xs text-center opacity-90">
              Please enter your email address.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
            />
            {error && (
              <p className="text-[#F9E055] text-xs font-normal text-center">
                {error}
              </p>
            )}
            <div className="flex justify-end mt-auto">
              <button
                onClick={handleNext}
                disabled={!isStep1Valid || loading}
                className="cursor-pointer disabled:cursor-default"
                style={actionButtonStyle(isStep1Valid && !loading)}
              >
                {loading ? "Sending..." : "Next"}
              </button>
            </div>
          </>
        )}

        {/* Step 2 - Verification Code */}
        {step === 2 && (
          <>
            <h1 className="text-white text-2xl font-semibold text-center">
              Enter Verification Code
            </h1>
            <p className="text-white text-xs text-center opacity-90">
              We've sent a verification code to:{" "}
              <span className="font-semibold">{email}</span>
            </p>
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(e.target.value, index)}
                  className="w-10 h-12 text-center text-lg font-bold bg-white rounded-md outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
                />
              ))}
            </div>
            {error && (
              <p className="text-[#F9E055] text-xs font-normal text-center">
                {error}
              </p>
            )}
            <p className="text-white text-xs text-center">
              Didn't receive the code?{" "}
              <span
                onClick={handleResend}
                className="text-[#F9E055] cursor-pointer"
                style={{ opacity: resendCooldown > 0 || loading ? 0.5 : 1 }}
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : "Resend"}
              </span>
            </p>
            <div className="flex justify-between mt-auto">
              <button
                onClick={() => { setStep(1); setError(""); }}
                className="cursor-pointer"
                style={backButtonStyle}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep2Valid || loading}
                className="cursor-pointer disabled:cursor-default"
                style={actionButtonStyle(isStep2Valid && !loading)}
              >
                {loading ? "Verifying..." : "Next"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 - Set New Password */}
        {step === 3 && (
          <>
            <h1 className="text-white text-2xl font-semibold text-center">
              Set New Password
            </h1>
            <p className="text-white text-xs text-center opacity-90">
              Password must contain an uppercase letter, a special character,
              and a number.
            </p>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 pr-11 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ cursor: "pointer" }}
              >
                {showNewPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <PasswordChecklist password={newPassword} />

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 pr-11 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ cursor: "pointer" }}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPassword !== "" && confirmPassword !== newPassword && (
              <p className="text-[#F9E055] text-xs font-normal text-center">
                Passwords do not match.
              </p>
            )}
            {error && (
              <p className="text-[#F9E055] text-xs font-normal text-center">
                {error}
              </p>
            )}
            <div className="flex justify-between mt-auto">
              <button
                onClick={() => { setStep(2); setError(""); }}
                className="cursor-pointer"
                style={backButtonStyle}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!isStep3Valid || loading}
                className="cursor-pointer disabled:cursor-default"
                style={actionButtonStyle(isStep3Valid && !loading)}
              >
                {loading ? "Saving..." : "Done"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {DesktopForgotPassword}
      {MobileForgotPassword}
    </>
  );
}

export default ForgotPassword;
