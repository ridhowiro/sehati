'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Settings, LogOut, User } from 'lucide-react'
import Link from 'next/link'

interface UserMenuProps {
  fullName: string
  role: string
  avatarUrl: string | null
  initials: string
}

export default function UserMenu({ fullName, role, avatarUrl, initials }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="text-right">
          <p className="text-sm dark:text-white text-zinc-900 font-medium">{fullName}</p>
          <p className="text-xs text-zinc-500">{role}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-xs font-medium">{initials}</span>
          )}
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">{fullName}</p>
            <p className="text-xs text-zinc-500 truncate">{role}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            >
              <Settings size={15} />
              Profil Saya
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors w-full text-left"
            >
              <LogOut size={15} />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}