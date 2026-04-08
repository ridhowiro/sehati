export const dynamic = 'force-dynamic'

import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ReviewLogTable from '@/components/review/review-log-table'
import DraftLogTable from '@/components/review/draft-log-table'

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
          <ReviewLogTable logs={pendingLogs} showReviewButton={true} />
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
            <DraftLogTable logs={draftLogs} />
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
            <ReviewLogTable logs={historyLogs} showReviewButton={false} />
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
