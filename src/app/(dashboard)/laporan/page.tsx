import { getUserRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import LaporanShell from '@/components/laporan/laporan-shell'

export const dynamic = 'force-dynamic'

const bulanNames = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

// Recompute is_late dari checkin_time vs jam_masuk + toleransi (timezone Jakarta UTC+7)
function computeIsLate(
  checkin_time: string | null,
  jam_masuk: string,
  toleransi_menit: number,
): { is_late: boolean; menit_terlambat: number } {
  if (!checkin_time) return { is_late: false, menit_terlambat: 0 }
  const dt = new Date(checkin_time)
  const jakartaMinutes = (dt.getUTCHours() * 60 + dt.getUTCMinutes() + 7 * 60) % (24 * 60)
  const [jh, jm] = jam_masuk.split(':').map(Number)
  const thresholdMinutes = jh * 60 + jm + toleransi_menit
  const is_late = jakartaMinutes > thresholdMinutes
  return { is_late, menit_terlambat: is_late ? jakartaMinutes - (jh * 60 + jm) : 0 }
}

function isWeekend(tanggal: string): boolean {
  const day = new Date(tanggal + 'T00:00:00').getDay()
  return day === 0 || day === 6
}

function generateMonthDates(tahun: number, bulan: number): string[] {
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const mm = String(bulan).padStart(2, '0')
  return Array.from({ length: lastDay }, (_, i) =>
    `${tahun}-${mm}-${String(i + 1).padStart(2, '0')}`
  )
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; tahun?: string; uid?: string }>
}) {
  const { user, userData, role } = await getUserRole()
  const admin = createAdminClient()
  const sp = await searchParams

  // 1. Allowed user IDs — hanya karyawan aktif
  let allowedIds: string[] = []
  if (role === 'karyawan') {
    allowedIds = [user.id]
  } else if (role === 'pic') {
    const { data } = await admin.from('users').select('id')
      .eq('bidang_id', userData?.bidang_id ?? '').eq('role', 'karyawan').eq('is_active', true)
    allowedIds = (data || []).map((u: any) => u.id)
  } else {
    const { data } = await admin.from('users').select('id').eq('role', 'karyawan').eq('is_active', true)
    allowedIds = (data || []).map((u: any) => u.id)
  }

  if (allowedIds.length === 0) {
    return <div className="p-8 text-zinc-400 text-sm">Tidak ada data yang bisa diakses.</div>
  }

  // 2. Periode tersedia
  const { data: allAbsensi } = await admin
    .from('absensi').select('tanggal').in('user_id', allowedIds)

  const rows = Array.isArray(allAbsensi) ? allAbsensi : []
  const periodeMap = new Map<string, { bulan: number; tahun: number; label: string }>()
  for (const row of rows) {
    const parts = String(row.tanggal).split('-')
    const t = parseInt(parts[0]), b = parseInt(parts[1])
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
  const allDates = generateMonthDates(activePeriod.tahun, activePeriod.bulan)

  // 4. Semua user yang diizinkan (termasuk yang belum ada absensinya)
  const { data: usersRaw } = await admin
    .from('users').select('id, full_name, bidang:bidang!users_bidang_id_fkey(nama)')
    .in('id', allowedIds).order('full_name')

  const userOptions = (usersRaw || []).map((u: any) => ({
    id: u.id, full_name: u.full_name, bidang_nama: u.bidang?.nama || null,
  }))

  const activeUid = sp.uid && allowedIds.includes(sp.uid) ? sp.uid : null
  const targetIds = activeUid ? [activeUid] : allowedIds

  // 5. Fetch semua data sekaligus
  const [absensiRes, izinRes, hariLiburRes, kantorConfigRes] = await Promise.all([
    admin.from('absensi')
      .select('user_id, tanggal, status, checkin_time, checkout_time, is_late, menit_terlambat')
      .in('user_id', targetIds).gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal'),
    admin.from('izin_karyawan')
      .select('user_id, tanggal_mulai, tanggal_selesai, jenis, status, keterangan, gdrive_link')
      .in('user_id', targetIds).neq('status', 'ditolak')
      .lte('tanggal_mulai', endDate).gte('tanggal_selesai', startDate),
    admin.from('hari_libur')
      .select('tanggal, nama').gte('tanggal', startDate).lte('tanggal', endDate),
    admin.from('kantor_config').select('jam_masuk, toleransi_menit').eq('is_active', true).limit(1).maybeSingle(),
  ])

  const jam_masuk: string = kantorConfigRes.data?.jam_masuk ?? '07:30:00'
  const toleransi_menit: number = kantorConfigRes.data?.toleransi_menit ?? 30

  // Build hari libur set
  const hariLiburMap = new Map<string, string>()
  for (const h of hariLiburRes.data || []) hariLiburMap.set(h.tanggal, h.nama)

  // Build absensi map per user
  const absensiMap: Record<string, Record<string, any>> = {}
  for (const a of absensiRes.data || []) {
    if (!absensiMap[a.user_id]) absensiMap[a.user_id] = {}
    absensiMap[a.user_id][a.tanggal] = a
  }

  // Build izin map per user
  type IzinRow = { tanggal_mulai: string; tanggal_selesai: string; jenis: string; status: string; keterangan?: string; gdrive_link?: string }
  const izinMap: Record<string, IzinRow[]> = {}
  for (const i of izinRes.data || []) {
    if (!izinMap[i.user_id]) izinMap[i.user_id] = []
    izinMap[i.user_id].push(i)
  }

  function getIzinForDate(tanggal: string, userIzin: IzinRow[]): IzinRow | null {
    return userIzin.find(i => i.status === 'disetujui' && i.tanggal_mulai <= tanggal && i.tanggal_selesai >= tanggal) ?? null
  }

  const rekapList = (usersRaw || []).filter((u: any) => targetIds.includes(u.id)).map((u: any) => {
    const userIzin = izinMap[u.id] || []
    const userAbsensi = absensiMap[u.id] || {}

    const absensi = allDates.map(tanggal => {
      const liburNama = hariLiburMap.get(tanggal)
      const weekend = isWeekend(tanggal)
      const absen = userAbsensi[tanggal]
      const izin = getIzinForDate(tanggal, userIzin)

      type IzinDetail = { jenis: string; tanggal_mulai: string; tanggal_selesai: string; keterangan?: string; gdrive_link?: string } | null

      // Hari libur nasional atau weekend
      if (liburNama || weekend) {
        return {
          tanggal,
          status: 'libur' as string,
          checkin_time: null as string | null,
          checkout_time: null as string | null,
          is_late: false,
          menit_terlambat: null as number | null,
          keterangan: liburNama || (weekend ? 'Akhir Pekan' : undefined),
          has_st: false,
          lupa_checkout: false,
          izin_detail: null as IzinDetail,
        }
      }

      // Ada record absensi
      if (absen) {
        const { is_late, menit_terlambat } = computeIsLate(absen.checkin_time, jam_masuk, toleransi_menit)
        const lupaCheckout = !!absen.checkin_time && !absen.checkout_time
        const hasST = !!(izin && izin.jenis === 'surat_tugas')
        let keterangan: string | undefined
        if (lupaCheckout) {
          keterangan = izin ? 'Lupa check-out · Sudah ada perizinan' : 'Lupa check-out'
        }

        return {
          tanggal,
          status: absen.status as string,
          checkin_time: absen.checkin_time,
          checkout_time: absen.checkout_time,
          is_late,
          menit_terlambat,
          keterangan,
          has_st: hasST,
          lupa_checkout: lupaCheckout && !izin,
          izin_detail: izin ? { jenis: izin.jenis, tanggal_mulai: izin.tanggal_mulai, tanggal_selesai: izin.tanggal_selesai, keterangan: izin.keterangan, gdrive_link: izin.gdrive_link } as IzinDetail : null,
        }
      }

      // Tidak ada absensi — cek izin
      if (izin) {
        return {
          tanggal,
          status: izin.jenis as string,
          checkin_time: null,
          checkout_time: null,
          is_late: false,
          menit_terlambat: null,
          keterangan: undefined,
          has_st: izin.jenis === 'surat_tugas',
          lupa_checkout: false,
          izin_detail: { jenis: izin.jenis, tanggal_mulai: izin.tanggal_mulai, tanggal_selesai: izin.tanggal_selesai, keterangan: izin.keterangan, gdrive_link: izin.gdrive_link } as IzinDetail,
        }
      }

      // Tidak hadir
      return {
        tanggal,
        status: 'tidak_hadir' as string,
        checkin_time: null,
        checkout_time: null,
        is_late: false,
        menit_terlambat: null,
        keterangan: undefined,
        has_st: false,
        lupa_checkout: false,
        izin_detail: null as IzinDetail,
      }
    })

    return { user_id: u.id, full_name: u.full_name, bidang_nama: u.bidang?.nama || null, absensi }
  })

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
