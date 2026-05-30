import { useNavigate } from "react-router-dom";
import rafiki from "../assets/rafiki.png";
import { useState } from "react";

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

  const isLoginValid = email.trim() !== "" && password.trim() !== "";

  const handleLogin = async () => {
    if (!isLoginValid) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("user_id", data.user_id);
        navigate("/home");
      } else {
        setError(data.message || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#D9D9D9" }}
        >
          <span className="text-[#333333] text-lg font-bold">←</span>
        </button>
        <img
          src={rafiki}
          alt="Login Illustration"
          className="w-4/5 h-4/5 object-contain object-center"
        />
      </div>

      <div
        className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-3"
        style={{ minHeight: "45%" }}
      >
        <h1 className="text-white text-2xl font-semibold text-center">
          Log In
        </h1>

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

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

       {error && (
  <div className="fixed bottom-8 left-4 right-4 z-[2000] bg-[#990000] rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
    <span className="text-white text-sm">ℹ️</span>
    <p className="text-xs text-white font-medium whitespace-nowrap overflow-hidden text-ellipsis">
      {error}
    </p>
  </div>
)}
        <div className="flex items-center justify-between mt-1">
          <label className="flex items-center gap-2 text-white text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "3px",
                border: "2px solid white",
                backgroundColor: "white",
                accentColor: "#990000",
                cursor: "pointer",
              }}
            />
            Remember me
          </label>
          <button
            onClick={() => navigate("/forgot-password")}
            className="text-[#F9E055] text-xs"
          >
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
      </div>
    </div>
  );
}

export default Login;