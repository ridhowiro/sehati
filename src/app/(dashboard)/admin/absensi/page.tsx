import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import ProsesKoreksiButton from '@/components/absensi/proses-koreksi-button'
import { CheckCircle2, XCircle, AlertCircle, Home, Clock } from 'lucide-react'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  })
}

function fmtTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

const statusAbsensiLabel: Record<string, { label: string; color: string }> = {
  hadir: { label: 'Hadir', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  wfh: { label: 'WFH', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  terlambat: { label: 'Terlambat', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
  tidak_hadir: { label: 'Tidak Hadir', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
}

const jenisKoreksiLabel: Record<string, string> = {
  koreksi_checkin: 'Koreksi Check-in',
  koreksi_checkout: 'Koreksi Check-out',
  dispensasi: 'Dispensasi',
}

export default async function AdminAbsensiPage() {
  const { userData } = await getUserRole()
  const canAccess = ['admin', 'kepala_sekretariat', 'kasubdit', 'pic'].includes(userData?.role ?? '')
  if (!canAccess) redirect('/')

  const supabase = await createClient()

  // Rekap absensi semua user hari ini
  const todayWib = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const { data: absensiHariIni } = await supabase
    .from('absensi')
    .select('*, users(full_name, bidang_id, bidang:bidang(nama))')
    .eq('tanggal', todayWib)
    .order('checkin_time', { ascending: true })

  // Koreksi pending
  const { data: koreksiPending } = await supabase
    .from('absensi_koreksi')
    .select('*, users(full_name), absensi(tanggal, checkin_time, checkout_time)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Rekap Absensi</h2>
        <p className="text-sm text-zinc-500 mt-1">Monitor kehadiran dan proses koreksi</p>
      </div>

      {/* Absensi hari ini */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Kehadiran Hari Ini — {fmtTanggal(todayWib)}
          </h3>
        </div>
        {absensiHariIni && absensiHariIni.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Nama</th>
                <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Status</th>
                <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Check-in</th>
                <th className="text-left px-4 py-2.5 font-medium text-zinc-500 text-xs">Check-out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {absensiHariIni.map((row: any) => {
                const st = statusAbsensiLabel[row.status] ?? statusAbsensiLabel.tidak_hadir
                return (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-zinc-900 dark:text-white font-medium">{row.users?.full_name}</p>
                      {row.users?.bidang?.nama && (
                        <p className="text-xs text-zinc-400">{row.users.bidang.nama}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${st.color}`}>
                        {st.label}
                      </span>
                      {row.is_late && (
                        <span className="ml-1 text-xs text-yellow-500">+{row.menit_terlambat}m</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{fmt(row.checkin_time)}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{fmt(row.checkout_time)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">
            Belum ada yang absen hari ini
          </div>
        )}
      </div>

      {/* Koreksi pending */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Permohonan Koreksi Pending
          </h3>
          {koreksiPending && koreksiPending.length > 0 && (
            <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full">
              {koreksiPending.length}
            </span>
          )}
        </div>
        {koreksiPending && koreksiPending.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {koreksiPending.map((k: any) => (
              <div key={k.id} className="px-4 py-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{k.users?.full_name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {jenisKoreksiLabel[k.jenis]} — {k.absensi ? fmtTanggal(k.absensi.tanggal) : ''}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{k.alasan}</p>
                    {k.waktu_koreksi && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Waktu koreksi: {new Date(k.waktu_koreksi).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                      </p>
                    )}
                  </div>
                  <ProsesKoreksiButton koreksiId={k.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">
            Tidak ada permohonan koreksi pending
          </div>
        )}
      </div>
    </div>
  )
}
