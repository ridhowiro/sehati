import { getUserRole } from '@/lib/get-user-role'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewDetail from '@/components/log/review-detail'

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

  const supabase = await createClient()

  const { data: log } = await supabase
    .from('log_bulanan')
    .select(`
      *,
      users!log_bulanan_user_id_fkey (full_name, email)
    `)
    .eq('id', id)
    .single()

  if (!log) redirect('/review')

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
        reviewerId={userData?.id}
      />
    </div>
  )
}