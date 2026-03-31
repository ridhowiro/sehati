import { createAdminClient } from '@/lib/supabase/admin'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusConfig = {
  draft: { label: 'Draft', color: 'text-zinc-500', bg: 'bg-zinc-100', icon: Clock },
  submitted: { label: 'Menunggu Review PIC', color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  reviewed_pic: { label: 'Menunggu Verifikasi Kasek', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
  verified_kasek: { label: 'Menunggu Persetujuan Kasubdit', color: 'text-purple-600', bg: 'bg-purple-50', icon: Clock },
  approved: { label: 'DISETUJUI', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
  revision: { label: 'Perlu Revisi', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
}

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: log } = await supabase
    .from('log_bulanan')
    .select(`
      *,
      users!log_bulanan_user_id_fkey (full_name, email)
    `)
    .eq('id', id)
    .single()

  if (!log) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center max-w-md w-full">
          <XCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">Dokumen Tidak Ditemukan</h1>
          <p className="text-gray-500 text-sm mt-2">QR Code ini tidak valid atau dokumen telah dihapus</p>
        </div>
      </div>
    )
  }

  const { data: entries } = await supabase
    .from('log_entry')
    .select('*')
    .eq('log_bulanan_id', id)
    .order('tanggal', { ascending: true })

  const { data: approvals } = await supabase
    .from('log_approval')
    .select(`*, users!log_approval_reviewer_id_fkey (full_name)`)
    .eq('log_bulanan_id', id)
    .order('urutan', { ascending: true })

  const { data: profil } = await supabase
    .from('pegawai_profil')
    .select('jabatan_formal')
    .eq('user_id', log.user_id)
    .single()

  const status = statusConfig[log.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header verifikasi */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div>
              <p className="text-xs text-gray-500">Sistem Verifikasi Dokumen</p>
              <h1 className="text-sm font-semibold text-gray-900">SEHATI — Sekretariat PMU HETI</h1>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-4 rounded-lg ${status.bg} mb-4`}>
            <StatusIcon size={32} className={status.color} />
            <div>
              <p className={`text-lg font-bold ${status.color}`}>{status.label}</p>
              <p className="text-sm text-gray-600">Status verifikasi dokumen</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Nama Pegawai</span>
              <span className="font-medium text-gray-900">{log.users?.full_name || log.users?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Jabatan</span>
              <span className="font-medium text-gray-900">{profil?.jabatan_formal || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Periode Log</span>
              <span className="font-medium text-gray-900">{bulanNames[log.bulan]} {log.tahun}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Jumlah Kegiatan</span>
              <span className="font-medium text-gray-900">{entries?.length || 0} kegiatan</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">ID Dokumen</span>
              <span className="font-mono text-xs text-gray-400">{id}</span>
            </div>
          </div>
        </div>
        {/* Tabel Kegiatan */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Detail Kegiatan</h2>
        <table className="w-full text-sm">
            <thead>
            <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Tanggal</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Kegiatan</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Output</th>
                <th className="text-left py-2 px-3 font-medium text-gray-500 text-xs">Kategori</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
            {entries?.map((entry: any) => (
                <tr key={entry.id}>
                <td className="py-2 px-3 text-gray-600 text-xs whitespace-nowrap">
                    {new Date(entry.tanggal).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </td>
                <td className="py-2 px-3 text-gray-900 text-xs">{entry.kegiatan}</td>
                <td className="py-2 px-3 text-gray-600 text-xs">{entry.output || '-'}</td>
                <td className="py-2 px-3 text-gray-600 text-xs">{entry.tag_kategori || '-'}</td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
        {/* Riwayat Approval */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Riwayat Persetujuan</h2>
          {approvals && approvals.length > 0 ? (
            <div className="space-y-3">
              {approvals.map((approval: any) => (
                <div key={approval.id} className="flex items-start gap-3">
                  {approval.status === 'approved' ? (
                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{approval.users?.full_name || '-'}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(approval.reviewed_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{approval.role_reviewer}</p>
                    {approval.komentar && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{approval.komentar}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Belum ada riwayat persetujuan</p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          Dokumen ini dapat diverifikasi keasliannya melalui sistem SEHATI PMU HETI
        </p>
      </div>
    </div>
  )
}