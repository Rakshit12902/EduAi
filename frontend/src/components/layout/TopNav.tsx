export default function TopNav({ title }: { title?: string }) {
  return (
    <header className="fixed top-0 right-0 w-full md:w-[calc(100%-16rem)] z-40 bg-surface/80 backdrop-blur-md px-6 py-4 flex justify-between items-center md:justify-end">
      {/* Mobile Logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="material-symbols-outlined text-primary font-bold">
          school
        </span>
        <span className="font-headline-md text-[24px] font-bold text-primary">
          EduAI
        </span>
      </div>

      {/* Desktop Optional Title */}
      {title && (
        <div className="hidden md:flex flex-col mr-auto">
          <h2 className="font-headline-md text-[24px] text-on-surface">
            {title}
          </h2>
          <p className="text-xs text-on-surface-variant flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            GPT-4 ACADEMIC ENGINE ACTIVE
          </p>
        </div>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-all active:opacity-80">
          <span className="material-symbols-outlined">search</span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-variant rounded-full relative transition-all active:opacity-80">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        
        {/* Desktop Profile Dropdown */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-full border border-outline-variant cursor-pointer hover:bg-surface-variant transition-colors">
          <span className="text-sm font-medium text-on-surface">Julian</span>
          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-on-secondary font-bold text-xs">
            JD
          </div>
          <span className="material-symbols-outlined text-sm">expand_more</span>
        </div>
        
        {/* Mobile Avatar */}
        <div className="w-8 h-8 rounded-full bg-secondary md:hidden flex items-center justify-center text-white text-xs font-bold">
          JD
        </div>
      </div>
    </header>
  );
}
