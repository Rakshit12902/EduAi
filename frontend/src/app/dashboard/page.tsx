export default function DashboardPage() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center max-w-md p-8">
        <div className="mb-6 w-16 h-16 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-3xl">chat</span>
        </div>
        <h1 className="text-2xl font-display text-on-surface mb-2">Welcome to EduAI</h1>
        <p className="text-on-surface-variant font-body mb-8">
          Select an existing chat slot from the sidebar or create a new one to start talking with your documents.
        </p>
      </div>
    </div>
  )
}
