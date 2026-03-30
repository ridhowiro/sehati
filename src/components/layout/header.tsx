import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const initials = user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-900 flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm text-white">{user?.email}</p>
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