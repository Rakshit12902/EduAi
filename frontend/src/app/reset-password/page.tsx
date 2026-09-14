"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user reached this page via a password recovery email link
    const checkRecovery = async () => {
      // Supabase passes recovery tokens in the URL hash (#access_token=...&type=recovery)
      if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) {
        setIsRecoveryMode(true);
      }

      // Also listen to auth state changes for PASSWORD_RECOVERY event
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecoveryMode(true);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    checkRecovery();
  }, []);

  // Handler 1: Send Password Reset Link
  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        if (error.message.includes("504") || error.message.toLowerCase().includes("timeout")) {
          setError(
            "Connection timed out (504). Please verify your Supabase SMTP settings (Host: smtp.gmail.com, Port: 587, and Google App Password)."
          );
        } else {
          setError(error.message);
        }
      } else {
        setSuccessMsg(
          "A password reset link has been sent to your email! Please check your inbox and click the link to set your new password."
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          "Failed to contact Supabase Auth service. Please check your network or SMTP configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handler 2: Set New Password (after clicking link in email)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Password updated successfully! Redirecting you to login...");
        setTimeout(() => {
          router.push("/login?reset=success");
        }, 2000);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecf4f3] bg-gradient-to-br from-[#e8f3f1] via-[#f1f6f8] to-[#e6f1ee] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-emerald-500 selection:text-white overflow-hidden">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-100/60 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Centered Card Container */}
      <div className="relative z-10 max-w-[480px] w-full bg-white rounded-[26px] sm:rounded-[32px] p-7 sm:p-10 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12),0_0_1px_1px_rgba(203,213,225,0.5)] border border-white/90">
        
        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 mx-auto mb-5 shadow-2xs">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>

        {/* Heading & Subtitle */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight">
            {isRecoveryMode ? "Set New Password" : "Forgot Password?"}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
            {isRecoveryMode
              ? "Enter and confirm your new secure password below."
              : "Enter your registered email address and we'll send you a password reset link."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm rounded-xl flex items-center gap-2.5">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm rounded-xl flex items-center gap-2.5 leading-relaxed">
            <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form: Recovery Mode (Set New Password) */}
        {isRecoveryMode ? (
          <form className="space-y-4" onSubmit={handleUpdatePassword}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5" htmlFor="new-password">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  className="w-full h-11 sm:h-12 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <input
                  className="w-full h-11 sm:h-12 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        ) : (
          /* Form: Request Reset Link */
          <form className="space-y-4" onSubmit={handleSendResetEmail}>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  className="w-full h-11 sm:h-12 pl-10 pr-4 bg-[#f4f8fb] hover:bg-[#edf3f8] focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  id="email"
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 sm:h-12 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-[0_8px_20px_-4px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
