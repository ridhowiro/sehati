import { getUserRole } from '@/lib/get-user-role'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

export default async function ReviewPage() {
  const { userData, role } = await getUserRole()

  if (!['pic', 'kepala_sekretariat', 'kasubdit', 'admin'].includes(role)) {
    redirect('/')
  }

  const supabase = await createClient()

  let query = supabase
    .from('log_bulanan')
    .select(`
      *,
      users!log_bulanan_user_id_fkey (full_name, email, bidang_id)
    `)
    .not('status', 'eq', 'draft')
    .order('submitted_at', { ascending: false })

  if (role === 'pic') {
    query = query.eq('status', 'submitted')
  } else if (role === 'kepala_sekretariat') {
    query = query.eq('status', 'reviewed_pic')
  } else if (role === 'kasubdit') {
    query = query.eq('status', 'verified_kasek')
  }

  const { data: logs } = await query

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Review Log</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {role === 'pic' && 'Log yang perlu kamu review sebagai PIC'}
          {role === 'kepala_sekretariat' && 'Log yang perlu kamu verifikasi'}
          {role === 'kasubdit' && 'Log yang perlu kamu setujui'}
          {role === 'admin' && 'Semua log yang masuk'}
        </p>
      </div>

      {logs && logs.length > 0 ? (
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
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                        {status.label}
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
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <p className="text-zinc-500">Tidak ada log yang perlu direview</p>
        </div>
      )}
    </div>
  )
}