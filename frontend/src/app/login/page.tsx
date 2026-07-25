"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
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
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-lowest">
      <div className="max-w-[1100px] w-full grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-[0px_4px_40px_rgba(0,0,0,0.06)] bg-white">
        
        {/* Left Side: Visual/Branding */}
        <div className="relative hidden md:flex flex-col justify-between p-12 text-white overflow-hidden bg-primary">
          <div className="absolute inset-0 z-0 bg-primary">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80 mix-blend-multiply"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                  school
                </span>
              </div>
              <span className="font-headline-md text-[24px] tracking-tight">EduAI Assistant</span>
            </div>
            
            <div className="max-w-md">
              <h1 className="font-display-lg text-[48px] font-bold leading-tight mb-6">
                Elevate your academic potential.
              </h1>
              <p className="font-body-lg text-[18px] text-white/80">
                Personalized AI-tutoring designed for deep, structured learning and academic excellence.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-surface-container-lowest">
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Welcome Back</h2>
            <p className="font-body-md text-[16px] text-on-surface-variant">Access your academic command center.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={handleGoogleLogin}
              className="flex-1 py-3 px-4 border border-outline-variant rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:bg-surface-container-low active:scale-95 group"
            >
              <svg className="group-hover:scale-110 transition-transform" height="20" viewBox="0 0 24 24" width="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="font-body-md text-[15px] text-on-surface font-medium">Google</span>
            </button>

            <button 
              onClick={handleGithubLogin}
              className="flex-1 py-3 px-4 border border-outline-variant rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:bg-surface-container-low active:scale-95 group"
            >
              <svg className="group-hover:scale-110 transition-transform" height="20" viewBox="0 0 24 24" width="20">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="#24292e"></path>
              </svg>
              <span className="font-body-md text-[15px] text-on-surface font-medium">GitHub</span>
            </button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-surface-container-lowest px-4 text-outline font-label-md">OR</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block font-body-md text-sm font-medium text-on-surface-variant mb-2" htmlFor="email">Email Address</label>
              <input
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-label-md"
                id="email"
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-body-md text-sm font-medium text-on-surface-variant" htmlFor="password">Password</label>
                <Link className="text-sm text-primary font-semibold hover:underline" href="/reset-password">Forgot password?</Link>
              </div>
              <input
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-label-md"
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-headline-md text-[20px] font-bold rounded-lg primary-glow transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          
          <p className="mt-8 text-center text-on-surface-variant font-body-md text-sm">
            Don't have an account?{" "}
            <Link className="text-primary font-semibold hover:underline" href="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
