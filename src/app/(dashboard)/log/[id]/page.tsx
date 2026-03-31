import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserRole } from '@/lib/get-user-role'
import { redirect } from 'next/navigation'
import LogDetail from '@/components/log/log-detail'
import DownloadPDFButton from '@/components/pdf/download-button'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default async function LogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user } = await getUserRole()
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  const { data: log } = await supabase
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

  const { data: approvalsRaw } = await supabase
    .from('log_approval')
    .select('*')
    .eq('log_bulanan_id', id)
    .order('urutan', { ascending: true })

  const approvals = await Promise.all(
    (approvalsRaw || []).map(async (approval) => {
      const { data: reviewer } = await adminSupabase
        .from('users')
        .select('full_name')
        .eq('id', approval.reviewer_id)
        .single()
      return { ...approval, reviewer }
    })
  )

  const { data: profil } = await supabase
    .from('pegawai_profil')
    .select('jabatan_formal')
    .eq('user_id', user.id)
    .single()

  const { data: userData } = await adminSupabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Log Bulanan — {bulanNames[log.bulan]} {log.tahun}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Isi kegiatan harian kamu untuk bulan ini
          </p>
        </div>
        <DownloadPDFButton
          log={log}
          entries={entries || []}
          approvals={approvals || []}
          userData={{
            full_name: userData?.full_name || user.email || '',
            jabatan_formal: profil?.jabatan_formal || null,
          }}
        />
      </div>
      <LogDetail log={log} entries={entries || []} userId={user.id} />
    </div>
  )
}