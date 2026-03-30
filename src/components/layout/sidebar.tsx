'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type UserRole = 'admin' | 'kasubdit' | 'kepala_sekretariat' | 'pic' | 'karyawan'

const allMenuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic', 'karyawan'],
  },
  {
    title: 'Log Bulanan',
    href: '/log',
    icon: BookOpen,
    roles: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic', 'karyawan'],
  },
  {
    title: 'Agenda',
    href: '/agenda',
    icon: Calendar,
    roles: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic', 'karyawan'],
  },
  {
    title: 'Kepegawaian',
    href: '/kepegawaian',
    icon: Users,
    roles: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic', 'karyawan'],
  },
  {
    title: 'Profil Saya',
    href: '/profil',
    icon: Settings,
    roles: ['admin', 'kasubdit', 'kepala_sekretariat', 'pic', 'karyawan'],
  },
  {
    title: 'Admin',
    href: '/admin/users',
    icon: Shield,
    roles: ['admin'],
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
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

  const menuItems = allMenuItems.filter(item =>
    role ? item.roles.includes(role) : item.roles.includes('karyawan')
  )

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-zinc-900 border-r border-zinc-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
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

      <nav className="flex-1 px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="px-2 py-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors w-full"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )
}