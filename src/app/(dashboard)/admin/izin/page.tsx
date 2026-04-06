import { getUserRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import ProsesIzinTable from '@/components/absensi/proses-izin-table'

export const dynamic = 'force-dynamic'

export default async function AdminIzinPage() {
  const { userData, role } = await getUserRole()

  const allowedRoles = ['admin', 'kepala_sekretariat', 'kasubdit', 'pic']
  if (!allowedRoles.includes(role)) redirect('/absensi')

  const admin = createAdminClient()

  let izinQuery = admin
    .from('izin_karyawan')
    .select(`
      *,
      users!izin_karyawan_user_id_fkey (full_name)
    `)
    .order('created_at', { ascending: false })

  if (role === 'pic') {
    // PIC hanya lihat izin anggota bidangnya
    const { data: members } = await admin
      .from('users')
      .select('id')
      .eq('bidang_id', userData?.bidang_id ?? '')
    const memberIds = (members || []).map((m: any) => m.id)
    if (memberIds.length > 0) {
      izinQuery = izinQuery.in('user_id', memberIds)
    }
  }

  const { data: izinList } = await izinQuery

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Izin Karyawan</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {role === 'pic' ? 'Konfirmasi pengajuan izin anggota tim Anda' : 'Konfirmasi pengajuan izin/cuti/sakit karyawan'}
        </p>
      </div>
      <ProsesIzinTable izinList={izinList ?? []} />
    </div>
  )
}
