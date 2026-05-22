import { useNavigate } from 'react-router-dom';
import amico from '../assets/amico.png';
import { useState } from 'react';

function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const TEMP_CODE = '123456';
  const TEMP_EMAIL = '2023100464@ms.bulsu.edu.ph';

  const handleNext = () => {
    if (step === 1) {
      if (email !== TEMP_EMAIL) {
        alert('Email not found!');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (code.join('') !== TEMP_CODE) {
        alert('Invalid verification code!');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (newPassword !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters!');
        return;
      }
      alert('Password reset successful!');
      navigate('/login');
    }
  };

  const handleCodeChange = (value, index) => {
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    // Auto focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`).focus();
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">

      {/* Top white section */}
      <div className="flex-1 bg-white flex items-center justify-center overflow-hidden relative">
    <button
          onClick={() => navigate("/login")}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#D9D9D9" }}
        >
          <span className="text-[#333333] text-lg font-bold">←</span>
        </button>
        <img
          src={amico}
          alt="Forgot Password Illustration"
          className="w-4/5 h-4/5 object-contain object-center"
        />
      </div>

      {/* Bottom red card */}
      <div className="bg-[#990000] rounded-t-4xl px-6 py-6 flex flex-col gap-4"
        style={{ minHeight: '45%' }}>

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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-md text-sm font-semibold"
                style={{ backgroundColor: '#FFEFEF', color: '#990000' }}
              >
                Next
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
              We've sent a verification code to:{'\n'}
              <span className="font-semibold">{email}</span>
            </p>
            {/* 6 code boxes */}
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(e.target.value, index)}
                  className="w-10 h-12 text-center text-lg font-bold bg-white rounded-md outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
                />
              ))}
            </div>
            <p className="text-white text-xs text-center">
              Didn't receive the code?{' '}
              <span className="text-[#F9E055] cursor-pointer">Resend</span>
            </p>
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 rounded-md text-sm font-semibold"
                style={{ backgroundColor: '#FFEFEF', color: '#990000' }}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-md text-sm font-semibold"
                style={{ backgroundColor: '#FFEFEF', color: '#990000' }}
              >
                Next
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
              Password must contain an uppercase letter, a special character, and a number.
            </p>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-md text-sm bg-white text-black outline-none border-2 border-transparent focus:border-[#FDC502] transition-all"
            />
            <div className="flex justify-between mt-2">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2 rounded-md text-sm font-semibold"
                style={{ backgroundColor: '#FFEFEF', color: '#990000' }}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 rounded-md text-sm font-semibold"
                style={{ backgroundColor: '#FFEFEF', color: '#990000' }}
              >
                Done
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;