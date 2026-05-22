import { useNavigate } from "react-router-dom";
import rafiki from "../assets/rafiki.png";
import { useState } from "react";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const TEMP_EMAIL = "2023100464@ms.bulsu.edu.ph";
  const TEMP_PASSWORD = "admin123";

  const handleLogin = () => {
    if (email === TEMP_EMAIL && password === TEMP_PASSWORD) {
      navigate("/home");
    } else {
      alert("Invalid email or password!");
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {/* Top white section - exact same as landing page */}
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

      {/* Bottom red card - exact same size as landing page */}
      <div
        className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-3"
        style={{ minHeight: "45%" }}
      >
        {/* Title */}
        <h1 className="text-white text-2xl font-semibold text-center">
          Log In
        </h1>

        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
        />

        {/* Password Input */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 text-sm"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between mt-4">
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

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-md text-sm font-semibold mt-4"
          style={{ backgroundColor: "#FFEFEF", color: "#990000" }}
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default Login;
