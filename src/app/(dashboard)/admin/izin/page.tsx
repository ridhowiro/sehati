import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProsesIzinTable from '@/components/absensi/proses-izin-table'

export default async function AdminIzinPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users').select('role').eq('id', user.id).single()

  const allowedRoles = ['admin', 'kepala_sekretariat', 'kasubdit']
  if (!allowedRoles.includes(userData?.role ?? '')) redirect('/absensi')

  const { data: izinList } = await supabase
    .from('izin_karyawan')
    .select(`
      *,
      users!izin_karyawan_user_id_fkey (full_name, bidang_id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Manajemen Izin Karyawan</h1>
        <p className="text-sm text-zinc-500 mt-1">Proses pengajuan ST, Cuti, dan Sakit</p>
      </div>
      <ProsesIzinTable izinList={izinList ?? []} />
    </div>
  )
}
