import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";

export default function HistoryPage() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      <Sidebar />
      <TopNav title="Study History" />

      <main className="pt-24 pb-32 md:pl-64 min-h-screen">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
          
          <div className="mb-8">
            <h1 className="font-headline-lg text-[32px] font-bold text-on-surface">
              Past Sessions
            </h1>
            <p className="text-on-surface-variant font-body-md mt-2">
              Review and resume your previous academic conversations.
            </p>
          </div>

          {/* Filters/Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input 
                type="text" 
                placeholder="Search chats by title or subject..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <select className="bg-white border border-outline-variant rounded-xl px-4 py-2.5 text-on-surface outline-none">
              <option>All Time</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>

          {/* History List */}
          <div className="space-y-4">
            
            <Link href="/chat">
              <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl ai-gradient-icon flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">Macroeconomics: Fiscal Policy</h3>
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-1">Analyzed World_Bank_Report_24.pdf for key fiscal projections and central bank reserve shifts.</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t border-outline-variant/30 md:border-none pt-4 md:pt-0">
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-surface-container rounded-md text-[10px] font-bold text-on-surface-variant uppercase">Econ</span>
                  </div>
                  <span className="text-xs text-on-surface-variant/80 font-label-md">Oct 24, 2026</span>
                </div>
              </div>
            </Link>

            <Link href="/chat">
              <div className="bg-white p-5 rounded-2xl border border-outline-variant/30 shadow-sm hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-white shrink-0">
                    <span className="material-symbols-outlined">biotech</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface group-hover:text-primary transition-colors">Biology: Cellular Respiration</h3>
                    <p className="text-sm text-on-surface-variant mt-1 line-clamp-1">Generated 15 mock questions based on Chapter 5 notes.</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 border-t border-outline-variant/30 md:border-none pt-4 md:pt-0">
                  <div className="flex gap-2">
                    <span className="px-2.5 py-1 bg-surface-container rounded-md text-[10px] font-bold text-on-surface-variant uppercase">Biology</span>
                  </div>
                  <span className="text-xs text-on-surface-variant/80 font-label-md">Oct 22, 2026</span>
                </div>
              </div>
            </Link>

          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
