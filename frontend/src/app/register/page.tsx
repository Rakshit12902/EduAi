"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      if (data.session) {
        router.push("/dashboard");
      } else if (data.user) {
        // Automatically sign in if session wasn't returned directly
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!signInErr) {
          router.push("/dashboard");
        } else {
          router.push("/login?registered=true");
        }
      } else {
        router.push("/login?registered=true");
      }
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setError(error.message);
    }
  };

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecf4f3] bg-gradient-to-br from-[#e8f3f1] via-[#f1f6f8] to-[#e6f1ee] flex items-center justify-center p-3 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white overflow-hidden">
      
      {/* Background Soft Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />
      <div className="absolute -top-12 -right-12 w-80 h-80 bg-gradient-to-bl from-emerald-100/60 via-teal-50/40 to-transparent rounded-[48px] blur-2xl pointer-events-none z-0" />

      {/* Soft Mint Background Card (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 lg:bottom-10 lg:left-10 z-0 hidden sm:block select-none pointer-events-none">
        <div className="relative bg-gradient-to-br from-[#eaf6f1]/95 via-[#f2faf6]/90 to-[#e0f3ea]/95 backdrop-blur-md border border-emerald-200/80 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-[0_20px_50px_-10px_rgba(5,150,105,0.18),0_0_1px_1px_rgba(255,255,255,0.9)] min-w-[210px] max-w-[245px] overflow-hidden">
          
          {/* Inner Ambient Glow */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

          {/* Botanical Foliage Accent */}
          <div className="absolute -bottom-4 -left-4 w-28 h-28 opacity-30 text-emerald-800 pointer-events-none">
            <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
              <path d="M12 88 C 24 58, 48 28, 92 8 C 76 38, 62 64, 52 88 Z" />
              <path d="M28 84 C 38 64, 58 44, 88 28 C 74 52, 58 72, 48 88 Z" opacity="0.65" />
            </svg>
          </div>

          {/* Card Content */}
          <div className="relative z-10 pl-1">
            <p className="text-[17px] sm:text-[19px] font-black text-slate-800 tracking-tight leading-[1.2] font-sans">
              A Smarter
              <br />
              You
              <br />
              Everyday
            </p>

            {/* Hand-drawn Green Scribble Underline */}
            <div className="mt-2.5 space-y-1">
              <svg className="w-20 h-2.5 text-emerald-500" viewBox="0 0 80 10" fill="none">
                <path d="M2 5C24 2 56 8 78 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <svg className="w-14 h-2 text-emerald-400 ml-2" viewBox="0 0 60 8" fill="none">
                <path d="M2 4C18 2 42 6 58 3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Card Modal Container */}
      <div className="max-w-[1240px] w-full bg-white rounded-[26px] sm:rounded-[34px] shadow-[0_24px_70px_-12px_rgba(15,23,42,0.12),0_0_1px_1px_rgba(203,213,225,0.4)] border border-white/90 overflow-hidden relative z-10 my-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[640px] lg:min-h-[720px] items-stretch">
          
          {/* Left Column: 3D Hero Artwork */}
          <div className="md:col-span-7 bg-[#f3f9f7] relative overflow-hidden flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-100">
            <img 
              src="/auth-art.png" 
              alt="EduAI - Elevate your academic potential"
              className="w-full h-full object-cover object-left-top select-none pointer-events-none"
            />
          </div>

          {/* Right Column: Interactive Register Form */}
          <div className="md:col-span-5 bg-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative">
            
            {/* Top-Right Handwritten Accent */}
            <div className="absolute top-6 right-6 sm:top-8 sm:right-8 text-right select-none pointer-events-none hidden sm:block">
              <div className="text-[13px] font-bold text-slate-800 tracking-tight leading-tight -rotate-3 font-sans">
                Smart Learning.
                <br />
                Brighter Futures.
              </div>
              <svg className="w-14 h-2.5 text-emerald-500/90 ml-auto mt-0.5 -rotate-3" viewBox="0 0 60 10" fill="none">
                <path d="M2 4C18 1 42 7 58 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M8 8C22 5 44 9 54 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Top Section / Form Content */}
            <div className="w-full pt-1 sm:pt-2">
              <div className="mb-5">
                <h1 className="text-3xl sm:text-[34px] font-black text-[#0a192f] tracking-tight leading-tight">
                  Create Account
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  Start your personalized learning journey.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200/80 leading-relaxed font-medium">
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200/80 leading-relaxed font-medium">
                  {message}
                </div>
              )}

              {/* Social Login Buttons (Google & GitHub) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="h-11 sm:h-12 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2.5 px-3 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <svg height="18" viewBox="0 0 24 24" width="18" className="shrink-0">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-[13px] font-semibold text-slate-800">Continue with Google</span>
                </button>

                <button 
                  type="button"
                  onClick={handleGithubLogin}
                  className="h-11 sm:h-12 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-xl flex items-center justify-center gap-2.5 px-3 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-[0.98] cursor-pointer"
                >
                  <svg className="shrink-0 fill-[#181717]" height="18" viewBox="0 0 24 24" width="18">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"></path>
                  </svg>
                  <span className="text-[13px] font-semibold text-slate-800">Continue with GitHub</span>
                </button>
              </div>

              {/* OR Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 font-semibold text-slate-400">OR</span>
                </div>
              </div>

              {/* Credentials Form */}
              <form className="space-y-3.5" onSubmit={handleRegister}>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1" htmlFor="name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <input
                      className="w-full h-11 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200/90 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                      id="name"
                      type="text"
                      placeholder="Julian Dubois"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                    </div>
                    <input
                      className="w-full h-11 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200/90 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                      id="email"
                      type="email"
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <input
                      className="w-full h-11 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200/90 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-11 sm:h-12 mt-2 bg-[#0ca668] hover:bg-[#098e59] active:bg-[#077a4c] text-white font-bold text-base rounded-xl transition-all duration-200 shadow-md shadow-emerald-700/20 active:scale-[0.99] disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{loading ? "Creating Account..." : "Create Account"}</span>
                  {!loading && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </button>
              </form>
              
              <p className="mt-4 text-center text-slate-600 text-sm">
                Already have an account?{" "}
                <Link className="text-[#0ca668] hover:text-[#098351] font-bold hover:underline" href="/login">
                  Log in
                </Link>
              </p>
            </div>

            {/* Bottom Quote Card */}
            <div className="mt-5 bg-[#f0fbf5] border border-emerald-100/80 rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden">
              <span className="text-[#86efac] text-3xl font-serif font-black leading-none select-none">
                “
              </span>
              <p className="text-slate-700 text-xs sm:text-[13px] font-medium leading-relaxed">
                “Better learning today,
                <br />
                <span className="pl-4 sm:pl-6 block">brighter opportunities tomorrow.”</span>
              </p>
              
              <div className="absolute right-4 bottom-2.5 opacity-50 pointer-events-none">
                <svg className="w-9 h-7 text-emerald-500" viewBox="0 0 36 28" fill="none">
                  <path d="M8 8L28 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 16L32 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M16 24L29 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
