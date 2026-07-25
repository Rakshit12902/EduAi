import { Sidebar } from "@/components/layout/Sidebar";
import TopNav from "@/components/layout/TopNav";
import MobileNav from "@/components/layout/MobileNav";

export default function LibraryPage() {
  return (
    <div className="bg-background text-on-surface min-h-screen">
      <Sidebar />
      <TopNav title="My Library" />

      <main className="pt-24 pb-32 md:pl-64 min-h-screen">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-12">
          
          <div className="flex justify-between items-end mb-8">
            <div>
              <h1 className="font-headline-lg text-[32px] font-bold text-on-surface">
                Knowledge Base
              </h1>
              <p className="text-on-surface-variant font-body-md mt-2">
                Manage your uploaded documents and reference materials.
              </p>
            </div>
            
            <button className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
              Upload Files
            </button>
          </div>

          {/* Upload Zone */}
          <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl p-10 flex flex-col items-center justify-center text-center mb-12 hover:bg-primary/10 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">upload_file</span>
            </div>
            <h3 className="font-headline-md font-bold text-lg text-primary mb-1">
              Drag & Drop files here
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Supported formats: PDF, DOCX, TXT, MD (Max 50MB)
            </p>
            <button className="md:hidden bg-primary text-white px-6 py-2 rounded-lg font-semibold w-full">
              Browse Files
            </button>
          </div>

          {/* Document List */}
          <div className="bg-white rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/30 bg-surface-container-lowest text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <div className="col-span-6 md:col-span-5">Document Name</div>
              <div className="col-span-3 hidden md:block">Chat Slot</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3 md:col-span-1 text-right">Actions</div>
            </div>

            {/* Item 1 */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/30 items-center hover:bg-surface-container-lowest transition-colors">
              <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-error">picture_as_pdf</span>
                <div className="truncate">
                  <p className="font-semibold text-on-surface text-sm truncate">World_Bank_Report_24.pdf</p>
                  <p className="text-xs text-on-surface-variant">1.2 MB • 45 pages</p>
                </div>
              </div>
              <div className="col-span-3 hidden md:block">
                <span className="text-sm text-on-surface-variant">Macroeconomics</span>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Ready
                </span>
              </div>
              <div className="col-span-3 md:col-span-1 flex justify-end">
                <button className="text-on-surface-variant hover:text-error transition-colors p-1">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

            {/* Item 2 */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-outline-variant/30 items-center hover:bg-surface-container-lowest transition-colors">
              <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">description</span>
                <div className="truncate">
                  <p className="font-semibold text-on-surface text-sm truncate">Syllabus_Fall_2026.docx</p>
                  <p className="text-xs text-on-surface-variant">250 KB • 4 pages</p>
                </div>
              </div>
              <div className="col-span-3 hidden md:block">
                <span className="text-sm text-on-surface-variant">General</span>
              </div>
              <div className="col-span-3 flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                  Processing (60%)
                </span>
              </div>
              <div className="col-span-3 md:col-span-1 flex justify-end">
                <button className="text-on-surface-variant hover:text-error transition-colors p-1">
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
