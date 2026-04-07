'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'

export interface AbsensiRekap {
  tanggal: string
  status: string
  checkin_time: string | null
  checkout_time: string | null
  is_late: boolean
  menit_terlambat: number | null
}

export interface LogEntry {
  tanggal: string
  kegiatan: string
  output: string | null
  tag_kategori: string | null
}

export interface KaryawanRekap {
  user_id: string
  full_name: string
  jabatan_formal: string | null
  bidang_nama: string | null
  bulan: number
  tahun: number
  absensi: AbsensiRekap[]
  log_entries: LogEntry[]
  log_status: string | null
  log_submitted_at: string | null
}

export interface UserOption {
  id: string
  full_name: string
  bidang_nama: string | null
}

export interface PeriodOption {
  bulan: number
  tahun: number
  label: string
}

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

async function getAllowedUserIds(role: string, userId: string, bidangId: string | null): Promise<string[]> {
  const adminSupabase = createAdminClient()
  if (role === 'karyawan') return [userId]
  if (role === 'pic') {
    if (!bidangId) return []
    const { data } = await adminSupabase.from('users').select('id').eq('bidang_id', bidangId)
    return (data || []).map((u: any) => u.id)
  }
  const { data } = await adminSupabase.from('users').select('id')
  return (data || []).map((u: any) => u.id)
}

export async function getAvailablePeriods(): Promise<PeriodOption[]> {
  const { role, user, userData } = await getUserRole()
  const adminSupabase = createAdminClient()
  const allowedIds = await getAllowedUserIds(role, user.id, userData?.bidang_id ?? null)
  if (allowedIds.length === 0) return []

  // Gabungkan periode dari absensi + log_bulanan
  const [absensiRes, logRes] = await Promise.all([
    adminSupabase.from('absensi').select('tanggal').in('user_id', allowedIds),
    adminSupabase.from('log_bulanan').select('bulan, tahun').in('user_id', allowedIds),
  ])

  const periodeSet = new Map<string, PeriodOption>()

  for (const row of absensiRes.data || []) {
    const d = new Date(row.tanggal + 'T00:00:00')
    const b = d.getMonth() + 1
    const t = d.getFullYear()
    const key = `${t}-${b}`
    if (!periodeSet.has(key)) periodeSet.set(key, { bulan: b, tahun: t, label: `${bulanNames[b]} ${t}` })
  }

  for (const row of logRes.data || []) {
    const key = `${row.tahun}-${row.bulan}`
    if (!periodeSet.has(key)) periodeSet.set(key, { bulan: row.bulan, tahun: row.tahun, label: `${bulanNames[row.bulan]} ${row.tahun}` })
  }

  return Array.from(periodeSet.values()).sort((a, b) =>
    b.tahun !== a.tahun ? b.tahun - a.tahun : b.bulan - a.bulan
  )
}

export async function getUsersForPeriod(bulan: number, tahun: number): Promise<UserOption[]> {
  const { role, user, userData } = await getUserRole()
  const adminSupabase = createAdminClient()
  const allowedIds = await getAllowedUserIds(role, user.id, userData?.bidang_id ?? null)
  if (allowedIds.length === 0) return []

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // User yang punya absensi ATAU log di periode ini
  const [absensiRes, logRes] = await Promise.all([
    adminSupabase.from('absensi').select('user_id').in('user_id', allowedIds).gte('tanggal', startDate).lte('tanggal', endDate),
    adminSupabase.from('log_bulanan').select('user_id').in('user_id', allowedIds).eq('bulan', bulan).eq('tahun', tahun),
  ])

  const userIds = new Set<string>([
    ...(absensiRes.data || []).map((r: any) => r.user_id),
    ...(logRes.data || []).map((r: any) => r.user_id),
  ])

  if (userIds.size === 0) return []

  const { data } = await adminSupabase
    .from('users')
    .select('id, full_name, bidang:bidang(nama)')
    .in('id', Array.from(userIds))
    .order('full_name')

  return (data || []).map((u: any) => ({
    id: u.id,
    full_name: u.full_name,
    bidang_nama: u.bidang?.nama || null,
  }))
}

export async function getRekapData(
  bulan: number,
  tahun: number,
  targetUserId?: string
): Promise<{ data: KaryawanRekap[] | null; error?: string }> {
  const { role, user, userData } = await getUserRole()
  const adminSupabase = createAdminClient()

  // Tentukan user IDs yang boleh diakses
  let allowedUserIds: string[] = []

  if (role === 'karyawan') {
    // Karyawan hanya bisa lihat diri sendiri
    allowedUserIds = [user.id]
  } else if (role === 'pic') {
    // PIC hanya bisa lihat tim di bidang yang sama
    if (!userData?.bidang_id) return { data: [], error: 'Bidang tidak ditemukan' }
    const { data: teamUsers } = await adminSupabase
      .from('users')
      .select('id')
      .eq('bidang_id', userData.bidang_id)
    allowedUserIds = (teamUsers || []).map((u: any) => u.id)
  } else {
    // admin/kasubdit/kasek: semua user
    const { data: allUsers } = await adminSupabase.from('users').select('id')
    allowedUserIds = (allUsers || []).map((u: any) => u.id)
  }

  // Filter by specific user if requested (and allowed)
  if (targetUserId) {
    if (!allowedUserIds.includes(targetUserId)) {
      return { data: null, error: 'Tidak diizinkan mengakses data karyawan ini' }
    }
    allowedUserIds = [targetUserId]
  }

  if (allowedUserIds.length === 0) return { data: [] }

  // Fetch users detail
  const { data: usersData } = await adminSupabase
    .from('users')
    .select('id, full_name, bidang:bidang(nama)')
    .in('id', allowedUserIds)
    .order('full_name')

  // Fetch profil jabatan — pakai adminClient karena RLS hanya izinkan lihat profil sendiri
  const { data: profilData } = await adminSupabase
    .from('pegawai_profil')
    .select('user_id, jabatan_formal')
    .in('user_id', allowedUserIds)

  const profilMap: Record<string, string | null> = {}
  ;(profilData || []).forEach((p: any) => {
    profilMap[p.user_id] = p.jabatan_formal
  })

  // Batas tanggal bulan tersebut
  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Fetch absensi — adminClient agar tidak terpotong RLS untuk role pic
  const { data: absensiData } = await adminSupabase
    .from('absensi')
    .select('user_id, tanggal, status, checkin_time, checkout_time, is_late, menit_terlambat')
    .in('user_id', allowedUserIds)
    .gte('tanggal', startDate)
    .lte('tanggal', endDate)
    .order('tanggal')

  // Fetch log bulanan — adminClient karena RLS log_entry hanya izinkan pemilik
  const { data: logData } = await adminSupabase
    .from('log_bulanan')
    .select('id, user_id, bulan, tahun, status, submitted_at')
    .in('user_id', allowedUserIds)
    .eq('bulan', bulan)
    .eq('tahun', tahun)

  const logIds = (logData || []).map((l: any) => l.id)

  // Fetch log entries — RLS hanya izinkan pemilik, pakai adminClient
  const { data: logEntriesData } = logIds.length > 0
    ? await adminSupabase
        .from('log_entry')
        .select('log_bulanan_id, tanggal, kegiatan, output, tag_kategori')
        .in('log_bulanan_id', logIds)
        .order('tanggal')
    : { data: [] }

  // Build maps
  const absensiMap: Record<string, AbsensiRekap[]> = {}
  ;(absensiData || []).forEach((a: any) => {
    if (!absensiMap[a.user_id]) absensiMap[a.user_id] = []
    absensiMap[a.user_id].push({
      tanggal: a.tanggal,
      status: a.status,
      checkin_time: a.checkin_time,
      checkout_time: a.checkout_time,
      is_late: a.is_late || false,
      menit_terlambat: a.menit_terlambat,
    })
  })

  const logMap: Record<string, { id: string; status: string; submitted_at: string | null }> = {}
  ;(logData || []).forEach((l: any) => {
    logMap[l.user_id] = { id: l.id, status: l.status, submitted_at: l.submitted_at }
  })

  const logEntriesMap: Record<string, LogEntry[]> = {}
  ;(logEntriesData || []).forEach((e: any) => {
    const log = (logData || []).find((l: any) => l.id === e.log_bulanan_id)
    if (!log) return
    if (!logEntriesMap[log.user_id]) logEntriesMap[log.user_id] = []
    logEntriesMap[log.user_id].push({
      tanggal: e.tanggal,
      kegiatan: e.kegiatan,
      output: e.output,
      tag_kategori: e.tag_kategori,
    })
  })

  const result: KaryawanRekap[] = (usersData || []).map((u: any) => ({
    user_id: u.id,
    full_name: u.full_name,
    jabatan_formal: profilMap[u.id] || null,
    bidang_nama: u.bidang?.nama || null,
    bulan,
    tahun,
    absensi: absensiMap[u.id] || [],
    log_entries: logEntriesMap[u.id] || [],
    log_status: logMap[u.id]?.status || null,
    log_submitted_at: logMap[u.id]?.submitted_at || null,
  }))

  return { data: result }
}
