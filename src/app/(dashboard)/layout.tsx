import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-2 bg-white dark:bg-zinc-900">
          <p className="text-xs text-zinc-400 text-center">
            SEHATI Version Beta 0.1 &nbsp;·&nbsp; ©2026 PMU HETI Kemdiktisaintek | Created with ❤️ by NRW & Claude AI
          </p>
        </footer>
      </div>
    </div>
  )
}