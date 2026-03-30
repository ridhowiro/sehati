import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ThemeToggle from '@/components/layout/theme-toggle'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <header className="h-14 border-b border-zinc-800 dark:bg-zinc-900 bg-white flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="text-right">
          <p className="text-sm dark:text-white text-zinc-900">{user?.email}</p>
          <p className="text-xs text-zinc-500">Karyawan</p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-zinc-700 text-white text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}