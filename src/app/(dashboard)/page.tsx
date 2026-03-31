import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { Users, FileText, CheckCircle, Clock } from 'lucide-react'

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
  const { user } = await getUserRole()
  const adminSupabase = createAdminClient()

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Hanya anggota tim (karyawan)
  const { data: allUsers } = await adminSupabase
    .from('users')
    .select('id, full_name, bidang:bidang!users_bidang_id_fkey(nama)')
    .eq('is_active', true)
    .eq('role', 'karyawan')
    .order('full_name')

  // Log bulanan bulan ini (pakai adminSupabase agar bypass RLS)
  const { data: logsThisMonth } = await adminSupabase
    .from('log_bulanan')
    .select('id, user_id, status')
    .eq('bulan', currentMonth)
    .eq('tahun', currentYear)

  // Ambil semua entri bulan ini lalu hitung per log
  const logIds = logsThisMonth?.map(l => l.id) ?? []
  const { data: allEntries } = logIds.length > 0
    ? await adminSupabase
        .from('log_entry')
        .select('log_bulanan_id')
        .in('log_bulanan_id', logIds)
    : { data: [] }

  const entryCountMap: Record<string, number> = {}
  for (const entry of allEntries ?? []) {
    entryCountMap[entry.log_bulanan_id] = (entryCountMap[entry.log_bulanan_id] ?? 0) + 1
  }

  // Bangun ranking
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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Dashboard</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Rekap log bulanan · {bulanNames[currentMonth]} {currentYear}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-zinc-400" />
            <p className="text-xs text-zinc-500">Total Anggota</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{totalAktif}</p>
          <p className="text-xs text-zinc-400 mt-1">anggota aktif</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-green-400" />
            <p className="text-xs text-zinc-500">Sudah Lapor</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{sudahLapor}</p>
          <p className="text-xs text-zinc-400 mt-1">bulan ini</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-yellow-400" />
            <p className="text-xs text-zinc-500">Belum Lapor</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{belumLapor}</p>
          <p className="text-xs text-zinc-400 mt-1">bulan ini</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={16} className="text-blue-400" />
            <p className="text-xs text-zinc-500">Total Kegiatan</p>
          </div>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-white">{totalEntri}</p>
          <p className="text-xs text-zinc-400 mt-1">semua anggota tim</p>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-white">
            Ranking Kegiatan · {bulanNames[currentMonth]} {currentYear}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Jumlah kegiatan yang dilaporkan, diurutkan dari terbanyak</p>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {ranking.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center gap-3 px-4 py-3 ${r.isMe ? 'bg-blue-500/5' : ''}`}
            >
              {/* Rank */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                i === 1 ? 'bg-zinc-400/20 text-zinc-300' :
                i === 2 ? 'bg-orange-500/20 text-orange-400' :
                'bg-zinc-800 text-zinc-500'
              }`}>
                {i + 1}
              </div>

              {/* Nama & bidang */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${r.isMe ? 'text-blue-400' : 'text-zinc-900 dark:text-white'}`}>
                  {r.full_name} {r.isMe && <span className="text-xs font-normal">(kamu)</span>}
                </p>
                <p className="text-xs text-zinc-500 truncate">{r.bidang}</p>
              </div>

              {/* Status */}
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

              {/* Jumlah entri */}
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
