import { Navigate, useNavigate } from "react-router-dom";
import rafiki from "../assets/rafiki.png";
import logowhite from "../assets/logowhite.png";
import bsulogo from "../assets/bsulogo.png";
import bsu from "../assets/bsu.jpg";
import { useState, useEffect } from "react";
import RoleSelectionModal from "../super-admin-components/RoleSelectionModal";
import AdminRoleSelectionModal from "../admin-components/AdminRoleSelectionModal";

const API_URL = import.meta.env.VITE_API_URL;


const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showAdminRoleSelection, setShowAdminRoleSelection] = useState(false);




  

    useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      if (role === "super_admin") navigate("/super_admin", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/home", { replace: true });
    } else if (token && !role) {
      localStorage.removeItem("token");
    }
  }, []);


  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const isLoginValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
  
    if (!isLoginValid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("user_id", data.user.user_id);
        localStorage.setItem("role", data.user.user_role);
        localStorage.setItem("first_name", data.user.first_name || "");
        localStorage.setItem("last_name", data.user.last_name || "");
        localStorage.setItem("email", data.user.email || "");
        localStorage.setItem("student_number", data.user.student_number || "");
        localStorage.setItem("faculty_id", data.user.faculty_id || "");
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("course_section", data.user.course_section || "");

        if (rememberMe) {
          localStorage.setItem("remembered_email", email);
        } else {
          localStorage.removeItem("remembered_email");
        }

        if (data.user.user_role === "super_admin") {
          localStorage.setItem("super_admin_id", data.user.super_admin_id);
          localStorage.setItem("office_location", data.user.office_location);
          localStorage.setItem("office_name", data.user.office_name || "");
          setShowRoleSelection(true);
        } else if (data.user.user_role === "admin") {
          localStorage.setItem("admin_id", data.user.admin_id);
          localStorage.setItem("office_location", data.user.office_location);
          localStorage.setItem("office_name", data.user.office_name || "");
          setShowAdminRoleSelection(true);
        } else {
          navigate("/home");
        }
      } else {
        setError(data.message || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── DESKTOP LAYOUT (md and above) ────────────────────────────────────────
const DesktopLogin = (
  <div
    className="hidden md:flex h-screen w-screen items-center justify-center"
    style={{
      position: "relative",
      overflow: "hidden",
    }}
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
        background: "radial-gradient(circle at 85% 10%, rgba(255,91,91,.30) 0%, rgba(225,27,27,.45) 28%, rgba(179,0,0,.60) 65%, rgba(146,0,0,.75) 100%)",
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
        className="bg-white flex flex-col justify-center"
        style={{
          width: "54%",
          paddingLeft: "58px",
          paddingRight: "58px",
        }}
      >

        {/* BulSU Logo + WELCOME */}
        <div className="flex items-center gap-2 mb-7 -ml-4">
          <img
            src={bsulogo}
            alt="BulSU Logo"
            className="w-25 h-25 object-contain"
          />

          <div>
            <p
              className="uppercase tracking-wider"
              style={{
                color: "#777",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Welcome
            </p>

            <h1
              style={{
                fontSize: "26px",
                fontWeight: 600,
                color: "#161616",
                lineHeight: "1.15",
              }}
            >
              Log in to your account
            </h1>
          </div>
        </div>

        {/* Email */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
          className="w-full border border-[#d8d8d8] bg-white outline-none"
          style={{
            height: "52px",
            padding: "0 15px",
            fontSize: "15px",
            marginBottom: "18px",
          }}
        />

        {/* Password */}
        <div className="relative mb-5">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="w-full border border-[#d8d8d8] bg-white outline-none"
            style={{
              height: "52px",
              paddingLeft: "15px",
              paddingRight: "45px",
              fontSize: "15px",
            }}
          />

          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-[#1A1208] cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "14px",
                height: "14px",
                accentColor: "#990000",
                cursor: "pointer",
              }}
            />
            Remember me
          </label>

          <button
            onClick={() => navigate("/forgot-password")}
            className="text-[#990000] text-sm font-medium hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading || !isLoginValid}
          className="w-full text-sm font-semibold transition-all active:scale-95"
          style={{
            height: "48px",
            backgroundColor: isLoginValid
              ? "#990000"
              : "rgba(153,0,0,.30)",
            color: "white",
            cursor: isLoginValid ? "pointer" : "default",
            boxShadow: "0 4px 10px rgba(0,0,0,.18)",
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 text-center mt-4">
            {error}
          </p>
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
          <img
            src={logowhite}
            alt="FoundNest"
            className="w-52 h-52 object-contain"
          />

          <p className="text-white text-[25px] font-bold mt-2">
            FoundNest
          </p>
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

  // ── MOBILE LAYOUT (original) ─────────────────────────────────────────────
  const MobileLogin = (
    <div className="flex md:hidden flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#D9D9D9" }}
        >
          <span className="text-[#333333] text-lg font-bold">←</span>
        </button>
        <img src={rafiki} alt="Login Illustration" className="w-4/5 h-4/5 object-contain object-center" />
      </div>

      <div className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-3" style={{ minHeight: "45%" }}>
        <h1 className="text-white text-2xl font-semibold text-center">Log In</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3">
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 text-white text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: "14px", height: "14px", borderRadius: "3px", border: "2px solid white", backgroundColor: "white", accentColor: "#990000", cursor: "pointer" }}
            />
            Remember me
          </label>
          <button onClick={() => navigate("/forgot-password")} className="text-[#F9E055] text-xs">
            Forgot password?
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: isLoginValid ? "#FFEFEF" : "rgba(255, 243, 224, 0.7)",
            color: isLoginValid ? "#990000" : "rgba(75, 45, 35, 0.7)",
            border: "none",
            borderRadius: "6px",
            width: "100%",
            padding: "12px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isLoginValid ? "pointer" : "default",
            marginTop: "8px",
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {error && (
          <div className="fixed bottom-8 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
            <span className="text-white text-sm">ℹ️</span>
            <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">{error}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {DesktopLogin}
      {MobileLogin}
      {showRoleSelection && (
          <RoleSelectionModal
              onClose={() => {
                  setShowRoleSelection(false);
                  navigate("/super_admin");
              }}
          />
      )}
      {showAdminRoleSelection && (
          <AdminRoleSelectionModal
              onClose={() => {
                  setShowAdminRoleSelection(false);
                  navigate("/admin");
              }}
          />
      )}
    </>
  );
}

export default Login;