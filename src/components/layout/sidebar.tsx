'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/layout/sidebar-context'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  Shield,
  Building2,
  ClipboardCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserRole = 'admin' | 'kasubdit' | 'kepala_sekretariat' | 'pic' | 'karyawan'

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const { mobileOpen, setMobileOpen } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (data) setRole(data.role as UserRole)
    }
    fetchRole()
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/admin')) setAdminOpen(true)
    setMobileOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) => pathname === href

  const menuItemClass = (href: string) => cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
    isActive(href)
      ? 'bg-zinc-700 text-white'
      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
  )

  const canReview = role && ['admin', 'kasubdit', 'kepala_sekretariat', 'pic'].includes(role)
  const isAdmin = role === 'admin'

  return (
    <>
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        'flex flex-col h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300 z-50',
        // Desktop
        'lg:relative lg:translate-x-0',
        collapsed ? 'lg:w-16' : 'lg:w-60',
        // Mobile
        'fixed top-0 left-0 w-72',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-800">
        {!collapsed && (
          <div>
            <h1 className="text-white font-semibold text-sm">SEHATI</h1>
            <p className="text-zinc-500 text-xs">Sekretariat HETI</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link href="/" className={menuItemClass('/')}>
          <LayoutDashboard size={18} className="shrink-0" />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        {/* Log Bulanan — hanya untuk karyawan */}
        {role === 'karyawan' && (
          <Link href="/log" className={menuItemClass('/log')}>
            <BookOpen size={18} className="shrink-0" />
            {!collapsed && <span>Log Bulanan</span>}
          </Link>
        )}

        {/* Review Log — hanya untuk reviewer */}
        {canReview && (
          <Link href="/review" className={menuItemClass('/review')}>
            <ClipboardCheck size={18} className="shrink-0" />
            {!collapsed && <span>Review Log</span>}
          </Link>
        )}

        {/* Agenda */}
        <Link href="/agenda" className={menuItemClass('/agenda')}>
          <Calendar size={18} className="shrink-0" />
          {!collapsed && <span>Agenda</span>}
        </Link>

        {/* Kepegawaian */}
        <Link href="/kepegawaian" className={menuItemClass('/kepegawaian')}>
          <Users size={18} className="shrink-0" />
          {!collapsed && <span>Kepegawaian</span>}
        </Link>

        {/* Admin — collapsible, hanya admin */}
        {isAdmin && (
          <div>
            <button
              onClick={() => !collapsed && setAdminOpen(!adminOpen)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Shield size={18} className="shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">Administrasi</span>
                  <ChevronDown
                    size={14}
                    className={cn('transition-transform', adminOpen && 'rotate-180')}
                  />
                </>
              )}
            </button>

            {adminOpen && !collapsed && (
              <div className="ml-4 mt-1 space-y-1 border-l border-zinc-800 pl-3">
                <Link
                  href="/admin/users"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive('/admin/users')
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  <Users size={15} className="shrink-0" />
                  <span>Manajemen User</span>
                </Link>
                <Link
                  href="/admin/bidang"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive('/admin/bidang')
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  )}
                >
                  <Building2 size={15} className="shrink-0" />
                  <span>Manajemen Bidang</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </aside>
    </>
  )
}