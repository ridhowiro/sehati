export const dynamic = 'force-dynamic'

import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusConfig = {
  submitted: { label: 'Menunggu Review', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  reviewed_pic: { label: 'Menunggu Kasek', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  verified_kasek: { label: 'Menunggu Kasubdit', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  approved: { label: 'Disetujui', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  revision: { label: 'Perlu Revisi', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
}

const pendingStatus: Record<string, string> = {
  pic: 'submitted',
  kepala_sekretariat: 'reviewed_pic',
  kasubdit: 'verified_kasek',
}

export default async function ReviewPage() {
  const { userData, role } = await getUserRole()

  if (!['pic', 'kepala_sekretariat', 'kasubdit', 'admin'].includes(role)) {
    redirect('/')
  }

  const supabase = createAdminClient()

  // --- Pending logs (perlu direview) ---
  let pendingQuery = supabase
    .from('log_bulanan')
    .select(`*, users!log_bulanan_user_id_fkey (full_name, email, bidang_id)`)
    .order('submitted_at', { ascending: false })

  if (role === 'admin') {
    pendingQuery = pendingQuery.not('status', 'eq', 'draft')
  } else {
    pendingQuery = pendingQuery.eq('status', pendingStatus[role])

    // PIC: filter hanya tim yang sama
    if (role === 'pic' && userData?.bidang_id) {
      const { data: teamUsers } = await supabase
        .from('users')
        .select('id')
        .eq('bidang_id', userData.bidang_id)
      const teamUserIds = (teamUsers ?? []).map((u: any) => u.id)
      if (teamUserIds.length > 0) {
        pendingQuery = pendingQuery.in('user_id', teamUserIds)
      } else {
        pendingQuery = pendingQuery.in('user_id', ['00000000-0000-0000-0000-000000000000'])
      }
    }
  }

  const { data: pendingLogs } = await pendingQuery

  // --- Draft logs (hanya admin) ---
  let draftLogs: any[] = []
  if (role === 'admin') {
    const { data: dLogs } = await supabase
      .from('log_bulanan')
      .select(`*, users!log_bulanan_user_id_fkey (full_name, email)`)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })

    if (dLogs && dLogs.length > 0) {
      const logIds = dLogs.map((l: any) => l.id)
      const { data: entryCounts } = await supabase
        .from('log_entry')
        .select('log_bulanan_id')
        .in('log_bulanan_id', logIds)

      const countMap: Record<string, number> = {}
      for (const e of entryCounts ?? []) {
        countMap[e.log_bulanan_id] = (countMap[e.log_bulanan_id] ?? 0) + 1
      }
      draftLogs = dLogs.map((l: any) => ({ ...l, entry_count: countMap[l.id] ?? 0 }))
    }
  }

  // --- History logs (sudah pernah direview oleh user ini) ---
  let historyLogs: any[] = []
  if (role !== 'admin') {
    const { data: approvals } = await supabase
      .from('log_approval')
      .select('log_bulanan_id')
      .eq('reviewer_id', userData.id)

    const reviewedIds = (approvals ?? []).map((a: any) => a.log_bulanan_id)

    if (reviewedIds.length > 0) {
      const { data: hLogs } = await supabase
        .from('log_bulanan')
        .select(`*, users!log_bulanan_user_id_fkey (full_name, email, bidang_id)`)
        .in('id', reviewedIds)
        .order('submitted_at', { ascending: false })
      historyLogs = hLogs ?? []
    }
  }

  const renderTable = (logs: any[], showReviewButton: boolean) => (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nama</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Periode</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Disubmit</th>
            <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {logs.map((log: any) => {
            const status = statusConfig[log.status as keyof typeof statusConfig]
            return (
              <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                  {log.users?.full_name || log.users?.email || '-'}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-white">
                  {bulanNames[log.bulan]} {log.tahun}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${status?.color ?? ''}`}>
                    {status?.label ?? log.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500">
                  {log.submitted_at
                    ? new Date(log.submitted_at).toLocaleDateString('id-ID')
                    : '-'}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/review/${log.id}`}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      showReviewButton
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {showReviewButton ? 'Review' : 'Lihat'}
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Review Log</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {role === 'pic' && 'Log yang perlu kamu review sebagai PIC'}
          {role === 'kepala_sekretariat' && 'Log yang perlu kamu verifikasi'}
          {role === 'kasubdit' && 'Log yang perlu kamu setujui'}
          {role === 'admin' && 'Semua log yang masuk'}
        </p>
      </div>

      {/* Menunggu Review */}
      <div className="space-y-3">
        {role !== 'admin' && (
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Menunggu Review
          </h3>
        )}
        {pendingLogs && pendingLogs.length > 0 ? (
          renderTable(pendingLogs, true)
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
            <p className="text-zinc-500 text-sm">Tidak ada log yang perlu direview</p>
          </div>
        )}
      </div>

      {/* Draft — hanya admin */}
      {role === 'admin' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Progress Draft Karyawan
          </h3>
          {draftLogs.length > 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Nama</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Periode</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Entri Diisi</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Dibuat</th>
                    <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {draftLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                        {log.users?.full_name || log.users?.email || '-'}
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-white">
                        {bulanNames[log.bulan]} {log.tahun}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${
                          log.entry_count === 0
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : log.entry_count < 10
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                          {log.entry_count} kegiatan
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(log.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/review/${log.id}`}
                          className="px-3 py-1 rounded text-xs bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
              <p className="text-zinc-500 text-sm">Tidak ada log dalam status draft</p>
            </div>
          )}
        </div>
      )}

      {/* Histori Review — hanya non-admin */}
      {role !== 'admin' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
            Histori Review
          </h3>
          {historyLogs.length > 0 ? (
            renderTable(historyLogs, false)
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <p className="text-zinc-500 text-sm">Belum ada histori review</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
