'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/components/layout/sidebar-context'

export default function MobileMenuButton() {
  const { setMobileOpen } = useSidebar()
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="lg:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
      <Menu size={20} />
    </button>
  )
}
