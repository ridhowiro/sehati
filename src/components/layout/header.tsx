import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ThemeToggle from '@/components/layout/theme-toggle'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  kasubdit: 'Kasubdit',
  kepala_sekretariat: 'Kepala Sekretariat',
  pic: 'PIC / Koordinator',
  karyawan: 'Karyawan',
}

export default async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select(`
      full_name, 
      role, 
      avatar_url,
      bidang:bidang!users_bidang_id_fkey (nama)
    `)
    .eq('id', user?.id)
    .single()

  const initials = userData?.full_name?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'U'

  return (
    <header className="h-14 border-b border-zinc-800 dark:bg-zinc-900 bg-white flex items-center justify-end px-6">
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <div className="text-right">
          <p className="text-sm dark:text-white text-zinc-900">
            {userData?.full_name || user?.email}
          </p>
          <p className="text-xs text-zinc-500">
            {roleLabels[userData?.role] || 'Karyawan'}
            {(userData?.bidang as any)?.nama && ` · ${(userData?.bidang as any)?.nama}`}
          </p>
        </div>
        <Avatar className="h-8 w-8">
          {userData?.avatar_url ? (
            <img src={userData.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
          ) : (
            <AvatarFallback className="bg-zinc-700 text-white text-xs">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </div>
    </header>
  )
}