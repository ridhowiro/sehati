import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import ProsesKoreksiButton from '@/components/absensi/proses-koreksi-button'
import { CheckCircle2, XCircle } from 'lucide-react'

function fmtTanggal(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

const jenisKoreksiLabel: Record<string, string> = {
  koreksi_checkin: 'Koreksi Check-in',
  koreksi_checkout: 'Koreksi Check-out',
  dispensasi: 'Dispensasi',
}

export default async function AdminAbsensiPage() {
  const { userData, role } = await getUserRole()
  const canAccess = ['admin', 'kepala_sekretariat', 'kasubdit', 'pic'].includes(role ?? '')
  if (!canAccess) redirect('/')

  const supabase = createAdminClient()

  // PIC hanya boleh lihat/proses tim di bidang-nya sendiri
  let teamUserIds: string[] | null = null
  if (role === 'pic') {
    const { data: teamUsers } = await supabase
      .from('users')
      .select('id')
      .eq('bidang_id', userData?.bidang_id ?? '00000000-0000-0000-0000-000000000000')
    teamUserIds = (teamUsers ?? []).map((u: any) => u.id)
    if (teamUserIds.length === 0) teamUserIds = ['00000000-0000-0000-0000-000000000000']
  }

  // Koreksi pending
  let koreksiQuery = supabase
    .from('absensi_koreksi')
    .select('*, users!absensi_koreksi_user_id_fkey(full_name), absensi(tanggal, checkin_time, checkout_time)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (teamUserIds) koreksiQuery = koreksiQuery.in('user_id', teamUserIds)
  const { data: koreksiPending } = await koreksiQuery

  // Log koreksi yang sudah diproses (disetujui/ditolak)
  let koreksiLogQuery = supabase
    .from('absensi_koreksi')
    .select('*, users!absensi_koreksi_user_id_fkey(full_name), diproses_oleh_user:users!absensi_koreksi_diproses_oleh_fkey(full_name), absensi(tanggal, checkin_time, checkout_time)')
    .in('status', ['disetujui', 'ditolak'])
    .order('diproses_at', { ascending: false })
    .limit(30)
  if (teamUserIds) koreksiLogQuery = koreksiLogQuery.in('user_id', teamUserIds)
  const { data: koreksiLog } = await koreksiLogQuery

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Koreksi Absensi</h2>
        <p className="text-sm text-zinc-500 mt-1">Proses permohonan koreksi absensi tim</p>
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

      {/* Log persetujuan koreksi */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Log Persetujuan Koreksi
          </h3>
        </div>
        {koreksiLog && koreksiLog.length > 0 ? (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {koreksiLog.map((k: any) => {
              const disetujui = k.status === 'disetujui'
              return (
                <div key={k.id} className="px-4 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">{k.users?.full_name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {jenisKoreksiLabel[k.jenis]} — {k.absensi ? fmtTanggal(k.absensi.tanggal) : ''}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">{k.alasan}</p>
                      {k.catatan_prosesor && (
                        <p className="text-xs text-zinc-400 mt-0.5">Catatan: {k.catatan_prosesor}</p>
                      )}
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Diproses oleh {k.diproses_oleh_user?.full_name ?? '—'}
                        {k.diproses_at ? ` · ${new Date(k.diproses_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border shrink-0 ${
                      disetujui
                        ? 'text-green-500 bg-green-500/10 border-green-500/20'
                        : 'text-red-500 bg-red-500/10 border-red-500/20'
                    }`}>
                      {disetujui ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {disetujui ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-500">
            Belum ada log koreksi yang diproses
          </div>
        )}
      </div>
    </div>
  )
}
