import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HariLiburManager from '@/components/absensi/hari-libur-manager'

export default async function HariLiburPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (userData?.role !== 'admin') redirect('/absensi')

  const currentYear = new Date().getFullYear()
  const { data: hariLibur } = await supabase
    .from('hari_libur')
    .select('*')
    .gte('tanggal', `${currentYear}-01-01`)
    .lte('tanggal', `${currentYear + 1}-12-31`)
    .order('tanggal')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Hari Libur & Cuti Bersama</h1>
        <p className="text-sm text-zinc-500 mt-1">Kelola hari libur nasional dan cuti bersama</p>
      </div>
      <HariLiburManager hariLibur={hariLibur ?? []} />
    </div>
  )
}
