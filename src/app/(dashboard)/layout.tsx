import Sidebar from '@/components/layout/sidebar'
import Header from '@/components/layout/header'
import { SidebarProvider } from '@/components/layout/sidebar-context'
import WelcomeModal from '@/components/onboarding/welcome-modal'
import CompleteProfileModal from '@/components/onboarding/complete-profile-modal'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
          <WelcomeModal />
          <CompleteProfileModal />
          <footer className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-white dark:bg-zinc-900">
            <p className="text-xs text-zinc-400 text-center">
              SEHATI Version Pra rilis 1 &nbsp;·&nbsp; ©2026 PMU HETI Kemdiktisaintek | Crafted with love ❤️ by NRW with a little AI Magic
            </p>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}