import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import { Users, FileText, CheckCircle, Clock } from 'lucide-react'
import CheckinCard from '@/components/absensi/checkin-card'
import BirthdayCard from '@/components/dashboard/birthday-card'
import BirthdayPopup from '@/components/dashboard/birthday-popup'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:          { label: 'Draft',              color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  submitted:      { label: 'Menunggu PIC',        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  reviewed_pic:   { label: 'Menunggu Kasek',      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  verified_kasek: { label: 'Menunggu Kasubdit',   color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  approved:       { label: 'Disetujui',           color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  revision:       { label: 'Perlu Revisi',        color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default async function HomePage() {
  const { user, role } = await getUserRole()
  const adminSupabase = createAdminClient()
  const supabase = await createClient()

  const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const todayMMDD = todayWib.slice(5) // MM-DD

  const [
    { data: kantor },
    { data: absensiHariIni },
    { data: allUsers },
    { data: logsThisMonth },
    { data: birthdayUsers },
  ] = await Promise.all([
    supabase.from('kantor_config').select('*').eq('is_active', true).maybeSingle(),
    supabase
      .from('absensi')
      .select('id, checkin_time, checkout_time, status, is_late, menit_terlambat, wajib_checkout')
      .eq('user_id', user.id)
      .eq('tanggal', todayWib)
      .maybeSingle(),
    adminSupabase
      .from('users')
      .select('id, full_name, bidang:bidang!users_bidang_id_fkey(nama)')
      .eq('is_active', true)
      .eq('role', 'karyawan')
      .order('full_name'),
    adminSupabase
      .from('log_bulanan')
      .select('id, user_id, status')
      .eq('bulan', currentMonth)
      .eq('tahun', currentYear),
    adminSupabase
      .from('pegawai_profil')
      .select('user_id, tanggal_lahir, users!inner(full_name, is_active, avatar_url)')
      .filter('tanggal_lahir', 'not.is', null),
  ])

  const todayBirthdays = (birthdayUsers ?? [])
    .filter((p: any) => {
      if (!p.tanggal_lahir || !p.users?.is_active) return false
      return p.tanggal_lahir.slice(5) === todayMMDD
    })
    .map((p: any) => ({
      user_id: p.user_id,
      full_name: p.users.full_name,
      avatar_url: p.users.avatar_url || null,
      tanggal_lahir: p.tanggal_lahir,
    }))

  const isMyBirthday = todayBirthdays.some((b: any) => b.user_id === user.id)

  const logIds = logsThisMonth?.map(l => l.id) ?? []
  const { data: allEntries } = logIds.length > 0
    ? await adminSupabase.from('log_entry').select('log_bulanan_id').in('log_bulanan_id', logIds)
    : { data: [] }

  const entryCountMap: Record<string, number> = {}
  for (const entry of allEntries ?? []) {
    entryCountMap[entry.log_bulanan_id] = (entryCountMap[entry.log_bulanan_id] ?? 0) + 1
  }

  const ranking = (allUsers || []).map((u) => {
    const log = logsThisMonth?.find(l => l.user_id === u.id)
    const entryCount = log ? (entryCountMap[log.id] ?? 0) : 0
    return {
      id: u.id,
      full_name: u.full_name,
      bidang: (u.bidang as any)?.nama ?? '—',
      entryCount,
      status: log?.status ?? null,
      isMe: u.id === user.id,
    }
  }).sort((a, b) => b.entryCount - a.entryCount)

  const totalAktif = allUsers?.length ?? 0
  const sudahLapor = logsThisMonth?.length ?? 0
  const belumLapor = totalAktif - sudahLapor
  const totalEntri = ranking.reduce((s, r) => s + r.entryCount, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          {bulanNames[currentMonth]} {currentYear}
        </p>
      </div>

      {/* Birthday Popup */}
      {todayBirthdays.length > 0 && (
        <BirthdayPopup birthdays={todayBirthdays} isMyBirthday={isMyBirthday} />
      )}

      {/* Birthday Card */}
      {todayBirthdays.length > 0 && (
        <BirthdayCard birthdays={todayBirthdays} currentUserId={user.id} />
      )}

      {/* Baris utama: Absensi + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* CheckinCard — hanya karyawan */}
        {kantor && role === 'karyawan' && (
          <div className="lg:col-span-2">
            <CheckinCard kantor={kantor} absensiHariIni={absensiHariIni} />
          </div>
        )}

        {/* Stats — kanan / bawah di mobile */}
        <div className={`${kantor && role === 'karyawan' ? 'lg:col-span-3' : 'lg:col-span-5'} grid grid-cols-2 gap-3 content-start`}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={15} className="text-zinc-400" />
              <p className="text-xs text-zinc-500">Total Anggota</p>
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{totalAktif}</p>
            <p className="text-xs text-zinc-400 mt-0.5">anggota aktif</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={15} className="text-green-400" />
              <p className="text-xs text-zinc-500">Sudah Lapor</p>
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{sudahLapor}</p>
            <p className="text-xs text-zinc-400 mt-0.5">bulan ini</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={15} className="text-yellow-400" />
              <p className="text-xs text-zinc-500">Belum Lapor</p>
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{belumLapor}</p>
            <p className="text-xs text-zinc-400 mt-0.5">bulan ini</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={15} className="text-blue-400" />
              <p className="text-xs text-zinc-500">Total Kegiatan</p>
            </div>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{totalEntri}</p>
            <p className="text-xs text-zinc-400 mt-0.5">semua anggota</p>
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
            Ranking Kegiatan · {bulanNames[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Diurutkan dari jumlah kegiatan terbanyak</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {ranking.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 px-4 py-3 ${r.isMe ? 'bg-blue-500/5' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                i === 1 ? 'bg-zinc-400/20 text-zinc-300' :
                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
              }`}>
                {i + 1}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${r.isMe ? 'text-blue-500' : 'text-zinc-900 dark:text-white'}`}>
                  {r.full_name} {r.isMe && <span className="text-xs font-normal opacity-70">(kamu)</span>}
                </p>
                <p className="text-xs text-zinc-500 truncate">{r.bidang}</p>
              </div>

              <div className="hidden sm:block shrink-0">
                {r.status ? (
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig[r.status]?.color}`}>
                    {statusConfig[r.status]?.label}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full border bg-zinc-500/10 text-zinc-500 border-zinc-500/20">
                    Belum lapor
                  </span>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-lg font-semibold text-zinc-900 dark:text-white">{r.entryCount}</p>
                <p className="text-xs text-zinc-500">kegiatan</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
