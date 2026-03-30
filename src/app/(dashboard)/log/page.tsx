import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserRole } from '@/lib/get-user-role'
import CreateLogButton from '@/components/log/create-log-button'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  submitted: { label: 'Menunggu PIC', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  reviewed_pic: { label: 'Menunggu Kasek', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  verified_kasek: { label: 'Menunggu Kasubdit', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  approved: { label: 'Disetujui', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  revision: { label: 'Perlu Revisi', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export default async function LogPage() {
  const { user } = await getUserRole()
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('log_bulanan')
    .select('*')
    .eq('user_id', user.id)
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const hasCurrentMonthLog = logs?.some(
    l => l.bulan === currentMonth && l.tahun === currentYear
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Log Bulanan</h2>
          <p className="text-sm text-zinc-500 mt-1">Laporan kegiatan bulanan kamu</p>
        </div>
        {!hasCurrentMonthLog && (
          <CreateLogButton
            userId={user.id}
            bulan={currentMonth}
            tahun={currentYear}
          />
        )}
      </div>

      {logs && logs.length > 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Periode</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Dibuat</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {logs.map((log) => {
                const status = statusConfig[log.status as keyof typeof statusConfig]
                return (
                  <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 text-zinc-900 dark:text-white font-medium">
                      {bulanNames[log.bulan]} {log.tahun}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(log.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/log/${log.id}`}
                        className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {log.status === 'draft' ? 'Isi Log' : 'Lihat'}
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
          <p className="text-zinc-500">Belum ada log bulanan</p>
          <p className="text-zinc-400 text-sm mt-1">Buat log untuk bulan ini dengan tombol di atas</p>
        </div>
      )}
    </div>
  )
}