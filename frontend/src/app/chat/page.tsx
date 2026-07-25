"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Welcome back, Julian. I've compiled the initial intelligence brief based on the uploaded documents regarding Global Macroeconomic Trends (2024).",
    },
  ]);
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    
    // Mock response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Here's an analysis based on your query. According to the World_Bank_Report_24.pdf, the key findings align with this perspective.`,
        },
      ]);
    }, 1000);
  };

  return (
    <div className="bg-surface text-on-surface font-body-md overflow-hidden min-h-screen flex flex-col relative">
      <Sidebar />
      <TopNav title="Research Intelligence Brief" />

      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 mt-16 overflow-y-auto hide-scrollbar p-6 pb-40">
        <div className="max-w-4xl mx-auto space-y-8">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-4 ${
                msg.role === "user" ? "justify-end" : ""
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-10 h-10 rounded-xl bg-primary-container flex-shrink-0 flex items-center justify-center text-white">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                </div>
              )}
              
              <div
                className={`flex-1 ${
                  msg.role === "user" ? "max-w-lg" : "space-y-4"
                }`}
              >
                <div
                  className={
                    msg.role === "user"
                      ? "bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-sm"
                      : "glass-panel p-6 rounded-2xl rounded-tl-none bg-white/70"
                  }
                >
                  <p className="font-body-md text-sm leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
              )}
            </div>
          ))}

          {/* Bento Style Insight Grid (Only show on first assistant message for mockup) */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Insight Card */}
              <div className="md:col-span-2 glass-panel p-6 rounded-2xl border-l-4 border-l-primary bg-white/70">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg text-on-surface">
                    Key Fiscal Projections
                  </h3>
                  <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">
                    Critical Insight
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Analysis suggests a 1.2% shift in central bank reserves which
                  directly correlates with the volatility observed in Chapter 4 of
                  your syllabus. This supports the hypothesis that emerging
                  markets are prioritizing liquidity over long-term yield.
                </p>
                <div className="mt-4 flex gap-2">
                  <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-label-md text-on-surface-variant">
                    #Economics
                  </span>
                  <span className="px-3 py-1 bg-surface-container rounded-full text-[11px] font-label-md text-on-surface-variant">
                    #FiscalPolicy
                  </span>
                </div>
              </div>

              {/* Side Document List Card */}
              <div className="bg-white/50 border border-outline-variant p-6 rounded-2xl flex flex-col">
                <h3 className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-tighter mb-4">
                  Attached Docs
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 hover:bg-white/80 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-outline-variant">
                    <span className="material-symbols-outlined text-primary">
                      description
                    </span>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold truncate">
                        World_Bank_Report_24.pdf
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        1.2 MB • PDF
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-2 hover:bg-white/80 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-outline-variant">
                    <span className="material-symbols-outlined text-primary">
                      table_chart
                    </span>
                    <div className="flex flex-col truncate">
                      <span className="text-xs font-bold truncate">
                        Historical_Data_Reserves.csv
                      </span>
                      <span className="text-[10px] text-on-surface-variant">
                        450 KB • CSV
                      </span>
                    </div>
                  </div>
                </div>
                <button className="mt-auto text-primary text-[11px] font-bold flex items-center justify-center gap-1 pt-4 hover:underline">
                  <span className="material-symbols-outlined text-sm">add</span>{" "}
                  View All Assets
                </button>
              </div>

              {/* Citations & References Section */}
              <div className="glass-panel p-6 rounded-2xl bg-white/70 md:col-span-3">
                <h3 className="font-headline-md text-on-surface mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    format_quote
                  </span>
                  Academic Citations
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 italic text-sm text-on-surface-variant">
                    "The intersection of digital currency proliferation and
                    traditional central bank policy represents the most
                    significant paradigm shift in the last three decades."
                    (Dubois, J. & Arnault, L., 2023)
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-[12px] text-primary">
                      Citation Style: APA 7th Edition
                    </span>
                    <button className="text-primary hover:text-secondary flex items-center gap-1 font-bold text-xs">
                      <span className="material-symbols-outlined text-sm">
                        content_copy
                      </span>{" "}
                      Copy Bibliography
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Glassmorphic Input Bar */}
      <div className="fixed bottom-8 left-0 w-full md:left-64 md:w-[calc(100%-16rem)] px-6 z-50">
        <div className="max-w-3xl mx-auto">
          <div
            className={`glass-panel rounded-full p-2 flex items-center gap-2 floating-input-shadow bg-white/70 transition-all ${
              isFocused ? "ring-2 ring-primary/20 border-primary/40" : "border-white/50"
            }`}
          >
            <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors group">
              <span className="material-symbols-outlined group-active:scale-90 transition-transform">
                add_circle
              </span>
            </button>
            <div className="flex-1 relative">
              <input
                className="w-full bg-transparent border-none focus:ring-0 outline-none font-body-md text-on-surface py-3 placeholder:text-on-surface-variant/50 font-[JetBrains Mono]"
                placeholder="Message EduAI Assistant or upload study materials..."
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
            <div className="flex items-center gap-1 px-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button
                onClick={handleSend}
                className="w-10 h-10 rounded-full message-gradient flex items-center justify-center text-white shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  send
                </span>
              </button>
            </div>
          </div>
          
          {/* Contextual Hint Labels */}
          <div className="flex justify-center gap-4 mt-3 animate-fade-in text-on-surface-variant/60">
            <span className="text-[10px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                verified
              </span>{" "}
              Cite Sources
            </span>
            <span className="text-[10px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                school
              </span>{" "}
              Exam Mode
            </span>
            <span className="text-[10px] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                translate
              </span>{" "}
              Language Support
            </span>
          </div>
        </div>
      </div>
      
      <MobileNav />
    </div>
  );
}
