import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import LogDetail from '@/components/log/log-detail'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default async function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getUserRole()
  const supabase = await createClient()


  const { data: log, error } = await supabase
    .from('log_bulanan')
    .select('*')
    .eq('id', id)
    .single()

  if (!log) redirect('/log')

  const { data: entries } = await supabase
    .from('log_entry')
    .select('*')
    .eq('log_bulanan_id', id)
    .order('tanggal', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Log Bulanan — {bulanNames[log.bulan]} {log.tahun}
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Isi kegiatan harian kamu untuk bulan ini
        </p>
      </div>
      <LogDetail log={log} entries={entries || []} userId={user.id} />
    </div>
  )
}