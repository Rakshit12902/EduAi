import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-container-lowest">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]"></div>
      </div>

      {/* Centered Glass Card */}
      <div className="relative z-10 max-w-[480px] w-full p-8 md:p-12 rounded-3xl glass-card bg-white shadow-xl shadow-primary/5 border border-outline-variant/30 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary-container mx-auto mb-6">
          <span className="material-symbols-outlined text-3xl">key</span>
        </div>
        
        <h1 className="font-headline-lg text-[32px] font-bold text-on-surface mb-3">
          Reset Password
        </h1>
        <p className="font-body-md text-on-surface-variant mb-8 leading-relaxed">
          Enter the email address associated with your account and we'll send you a link to reset your password.
        </p>

        <form className="space-y-6 text-left">
          <div>
            <label
              className="block font-body-md text-sm font-medium text-on-surface-variant mb-2"
              htmlFor="email"
            >
              Email Address
            </label>
            <input
              className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-label-md"
              id="email"
              placeholder="student@university.edu"
              type="email"
            />
          </div>
          
          <button className="w-full py-4 bg-primary text-white font-headline-md text-lg font-bold rounded-lg primary-glow transition-all active:scale-[0.98]">
            Send Reset Link
          </button>
        </form>

        <div className="mt-8">
          <Link href="/login" className="flex items-center justify-center gap-2 text-primary font-semibold hover:underline text-sm transition-all group">
            <span className="material-symbols-outlined text-lg group-hover:-translate-x-1 transition-transform">
              arrow_back
            </span>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
