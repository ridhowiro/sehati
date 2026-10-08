import { getUserRole } from '@/lib/get-user-role'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewDetail from '@/components/log/review-detail'
import { createAdminClient } from '@/lib/supabase/admin'
import { canReviewLog, getBidangIdsWithPic } from '@/lib/log-review'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userData, role } = await getUserRole()

  if (!['pic', 'kepala_sekretariat', 'kasubdit', 'admin'].includes(role)) {
    redirect('/')
  }

const supabase = createAdminClient()

  const { data: log } = await supabase
    .from('log_bulanan')
    .select(`
      *,
      users!log_bulanan_user_id_fkey (full_name, email, bidang_id)
    `)
    .eq('id', id)
    .single()

  if (!log) redirect('/review')

  const bidangWithPic = await getBidangIdsWithPic()
  const canReview = canReviewLog(
    userData,
    { status: log.status, ownerBidangId: log.users?.bidang_id ?? null },
    bidangWithPic,
  )

  // PIC hanya boleh membuka log tim sendiri, atau log yang pernah ia review (histori)
  if (role === 'pic' && !canReview && log.users?.bidang_id !== userData?.bidang_id) {
    const { count } = await supabase
      .from('log_approval')
      .select('id', { count: 'exact', head: true })
      .eq('log_bulanan_id', id)
      .eq('reviewer_id', userData?.id)
    if (!count) redirect('/review')
  }

  const { data: entries } = await supabase
    .from('log_entry')
    .select('*')
    .eq('log_bulanan_id', id)
    .order('tanggal', { ascending: true })

  const { data: approvals } = await supabase
    .from('log_approval')
    .select(`
      *,
      users!log_approval_reviewer_id_fkey (full_name)
    `)
    .eq('log_bulanan_id', id)
    .order('urutan', { ascending: true })

  const nextMonth = log.bulan === 12 ? 1 : log.bulan + 1
  const nextYear = log.bulan === 12 ? log.tahun + 1 : log.tahun
  const startOfMonth = `${log.tahun}-${String(log.bulan).padStart(2, '0')}-01`
  const startOfNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
  const { data: hariLibur } = await supabase
    .from('hari_libur')
    .select('tanggal')
    .gte('tanggal', startOfMonth)
    .lt('tanggal', startOfNextMonth)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Review Log — {log.users?.full_name || log.users?.email}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          {bulanNames[log.bulan]} {log.tahun}
        </p>
      </div>
      <ReviewDetail
        log={log}
        entries={entries || []}
        approvals={approvals || []}
        reviewerRole={role}
        canReview={canReview}
        hariLibur={(hariLibur || []).map(h => h.tanggal)}
      />
    </div>
  )
}