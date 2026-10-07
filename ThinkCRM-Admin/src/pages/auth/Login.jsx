import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "@/store/api/auth/authApiSlice";
import { setUser } from "@/store/api/auth/authSlice";
import { toast } from "react-toastify";
import Icon from "@/components/ui/Icon";

const Login = () => {
  const [view, setView] = useState("login"); // 'login' or 'forgot'
  const [email, setEmail] = useState("thinkcrm@gmail.com");
  const [password, setPassword] = useState("thinkcrm");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();

  const onLoginSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return; // Prevent multiple clicks
    try {
      const response = await login({ email, password }).unwrap();
      
      if (response.success) {
        dispatch(setUser({ 
          user: response.data.user, 
          token: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          sessionId: response.data.user._id
        }));
        toast.success("Login Successful");
        navigate("/");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Login failed");
    }
  };

  const onForgotSubmit = async (e) => {
    e.preventDefault();
    if (isForgotLoading) return; // Prevent multiple clicks
    
    setIsForgotLoading(true);
    try {
      // Mock forgot password for now, since it wasn't requested in backend spec
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("If your email exists in our system, a password reset link has been sent.");
      setView("login");
    } catch (err) {
      toast.error("Network error");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden"
    >
      {/* Right side wave */}
      <div 
        className="absolute top-0 right-0 z-0 pointer-events-none"
        style={{
          width: '35vw',
          height: '80vh',
          backgroundImage: `url('/login-bg.svg')`,
          backgroundSize: 'contain',
          backgroundPosition: 'right top',
          backgroundRepeat: 'no-repeat'
        }}
      />
      {/* Left side wave (rotated/flipped or just positioned bottom-left) */}
      <div 
        className="absolute bottom-0 left-0 z-0 pointer-events-none"
        style={{
          width: '35vw',
          height: '72vh',
          backgroundImage: `url('/login-bg.svg')`,
          backgroundSize: 'contain',
          backgroundPosition: 'left bottom',
          backgroundRepeat: 'no-repeat',
          transform: 'rotate(180deg)'
        }}
      />
      
      <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full max-w-[480px] p-8 md:p-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <span className="text-4xl font-bold text-[#1e58c8] tracking-tight">ThinkCRM</span>
          </div>
          
          {view === "login" ? (
            <>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Great to see you here <span className="inline-block origin-bottom-right hover:animate-wave">👋</span>
              </h2>
              <p className="text-sm text-slate-500 text-center px-4">
                Let's get you signed in. Enter your email and password to continue.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 text-center px-4 mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </>
          )}
        </div>

        {view === "login" ? (
          <form onSubmit={onLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="admin@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-slate-200 rounded-md pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow tracking-wider"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  <Icon icon={showPassword ? "heroicons:eye-slash" : "heroicons:eye"} className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Keep me signed in</span>
              </label>
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#1e58c8] hover:bg-[#1646a3] text-white font-medium rounded-md px-4 py-2.5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={onForgotSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="you@example.com"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600">Agree the Terms & Policy</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isForgotLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#1e58c8] hover:bg-[#1646a3] text-white font-medium rounded-md px-4 py-2.5 transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isForgotLoading && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isForgotLoading ? "Sending..." : "Send Request"}
            </button>
            
            <div className="text-center mt-6">
              <span className="text-sm text-slate-500">Return to </span>
              <button
                type="button"
                onClick={() => setView("login")}
                disabled={isForgotLoading}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium underline underline-offset-4 disabled:opacity-50"
              >
                Sign in
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
