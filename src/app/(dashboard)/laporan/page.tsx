import { getUserRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import LaporanShell from '@/components/laporan/laporan-shell'

export const dynamic = 'force-dynamic'

const bulanNames = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; tahun?: string; uid?: string }>
}) {
  const { user, userData, role } = await getUserRole()
  const admin = createAdminClient()
  const sp = await searchParams

  // 1. Ambil semua user IDs yang boleh diakses
  let allowedIds: string[] = []
  if (role === 'karyawan') {
    allowedIds = [user.id]
  } else if (role === 'pic') {
    const { data } = await admin.from('users').select('id').eq('bidang_id', userData?.bidang_id ?? '')
    allowedIds = (data || []).map((u: any) => u.id)
  } else {
    const { data } = await admin.from('users').select('id')
    allowedIds = (data || []).map((u: any) => u.id)
  }

  if (allowedIds.length === 0) {
    return <div className="p-8 text-zinc-400 text-sm">Tidak ada data yang bisa diakses.</div>
  }

  // 2. Ambil periode tersedia dari absensi
  const { data: allAbsensi, error: absensiError } = await admin
    .from('absensi')
    .select('tanggal')
    .in('user_id', allowedIds)

  const rows = Array.isArray(allAbsensi) ? allAbsensi : []
  const periodeMap = new Map<string, { bulan: number; tahun: number; label: string }>()
  for (const row of rows) {
    const parts = String(row.tanggal).split('-')
    const t = parseInt(parts[0])
    const b = parseInt(parts[1])
    const key = `${t}-${b}`
    if (!periodeMap.has(key)) periodeMap.set(key, { bulan: b, tahun: t, label: `${bulanNames[b]} ${t}` })
  }

  const availablePeriods = Array.from(periodeMap.values())
    .sort((a, b) => b.tahun !== a.tahun ? b.tahun - a.tahun : b.bulan - a.bulan)

  if (availablePeriods.length === 0) {
    return <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Laporan Absensi</h2>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center text-sm text-zinc-400">
        Belum ada data absensi
      </div>
    </div>
  }

  // 3. Periode aktif
  const activeBulan = sp.bulan ? Number(sp.bulan) : availablePeriods[0].bulan
  const activeTahun = sp.tahun ? Number(sp.tahun) : availablePeriods[0].tahun
  const activePeriod = periodeMap.get(`${activeTahun}-${activeBulan}`) ?? availablePeriods[0]

  const startDate = `${activePeriod.tahun}-${String(activePeriod.bulan).padStart(2, '0')}-01`
  const lastDay = new Date(activePeriod.tahun, activePeriod.bulan, 0).getDate()
  const endDate = `${activePeriod.tahun}-${String(activePeriod.bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // 4. User yang punya absensi di periode ini
  const { data: absensiPeriode } = await admin
    .from('absensi')
    .select('user_id')
    .in('user_id', allowedIds)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)

  const userIdsWithData = [...new Set((absensiPeriode || []).map((r: any) => r.user_id))]
  const { data: usersRaw } = await admin
    .from('users')
    .select('id, full_name, bidang:bidang!users_bidang_id_fkey(nama)')
    .in('id', userIdsWithData)
    .order('full_name')

  const userOptions = (usersRaw || []).map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    bidang_nama: u.bidang?.nama || null,
  }))

  // 5. Filter user aktif
  const activeUid = sp.uid && userIdsWithData.includes(sp.uid) ? sp.uid : null
  const targetIds = activeUid ? [activeUid] : userIdsWithData

  // 6. Fetch absensi untuk target user
  const { data: absensiData } = await admin
    .from('absensi')
    .select('user_id, tanggal, status, checkin_time, checkout_time, is_late, menit_terlambat')
    .in('user_id', targetIds)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .order('tanggal')

  // 7. Fetch detail user
  const { data: targetUsersRaw } = await admin
    .from('users')
    .select('id, full_name, bidang:bidang!users_bidang_id_fkey(nama)')
    .in('id', targetIds)
    .order('full_name')

  // 8. Fetch izin yang dikonfirmasi untuk periode ini
  const { data: izinData } = await admin
    .from('izin_karyawan')
    .select('user_id, tanggal_mulai, tanggal_selesai, jenis, status')
    .in('user_id', targetIds)
    .neq('status', 'ditolak')
    .lte('tanggal_mulai', endDate)
    .gte('tanggal_selesai', startDate)

  // Build maps
  const absensiMap: Record<string, any[]> = {}
  for (const a of absensiData || []) {
    if (!absensiMap[a.user_id]) absensiMap[a.user_id] = []
    absensiMap[a.user_id].push(a)
  }

  const izinMap: Record<string, { tanggal_mulai: string; tanggal_selesai: string; jenis: string; status: string }[]> = {}
  for (const i of izinData || []) {
    if (!izinMap[i.user_id]) izinMap[i.user_id] = []
    izinMap[i.user_id].push(i)
  }

  // Override status absensi dengan izin yang relevan
  function getEffectiveStatus(tanggal: string, status: string, userIzin: typeof izinMap[string]): string {
    if (status !== 'tidak_hadir') return status
    const match = userIzin?.find(i => i.tanggal_mulai <= tanggal && i.tanggal_selesai >= tanggal)
    return match ? match.jenis : status
  }

  const rekapList = (targetUsersRaw || []).map((u: any) => ({
    user_id: u.id,
    full_name: u.full_name,
    bidang_nama: u.bidang?.nama || null,
    absensi: (absensiMap[u.id] || []).map((a: any) => ({
      ...a,
      status: getEffectiveStatus(a.tanggal, a.status, izinMap[u.id] || []),
    })),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Laporan Absensi</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {role === 'karyawan' ? 'Rekap absensi kamu' : role === 'pic' ? 'Rekap absensi tim kamu' : 'Rekap absensi semua karyawan'}
        </p>
      </div>
      <LaporanShell
        availablePeriods={availablePeriods}
        activePeriod={activePeriod}
        userOptions={userOptions}
        activeUid={activeUid}
        rekapList={rekapList}
        isKaryawan={role === 'karyawan'}
      />
    </div>
  )
}
