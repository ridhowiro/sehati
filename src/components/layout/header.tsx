import { createClient } from '@/lib/supabase/server'
import ThemeToggle from '@/components/layout/theme-toggle'
import UserMenu from '@/components/layout/user-menu'
import Clock from '@/components/layout/clock'
import MobileMenuButton from '@/components/layout/mobile-menu-button'
import TutorialButton from '@/components/onboarding/tutorial-button'
import NotificationBell from '@/components/layout/notification-bell'

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  kasubdit: 'Kasubdit',
  kepala_sekretariat: 'Kepala Sekretariat',
  pic: 'PIC / Koordinator',
  karyawan: 'Anggota Tim',
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
  const roleLabel = roleLabels[userData?.role] || 'Anggota Tim'
  const bidangNama = (userData?.bidang as any)?.nama
  const roleDisplay = bidangNama ? `${roleLabel} · ${bidangNama}` : roleLabel

  return (
    <header className="h-14 border-b border-zinc-800 dark:bg-zinc-900 bg-white flex items-center justify-between px-4 gap-3">
      <div className="flex items-center gap-2">
        <MobileMenuButton />
        <Clock />
      </div>
      <div className="flex items-center gap-3">
        <TutorialButton />
        <NotificationBell userId={user?.id ?? ''} />
        <ThemeToggle />
        <UserMenu
          fullName={userData?.full_name || user?.email || ''}
          role={roleDisplay}
          avatarUrl={userData?.avatar_url || null}
          initials={initials}
        />
      </div>
    </header>
  )
}