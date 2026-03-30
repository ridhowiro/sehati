'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const statusColors = {
  selesai: 'bg-green-500/10 text-green-400 border-green-500/20',
  proses: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ditunda: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const nextStatus: Record<string, string> = {
  pic: 'reviewed_pic',
  kepala_sekretariat: 'verified_kasek',
  kasubdit: 'approved',
  admin: 'approved',
}

const urutanMap: Record<string, number> = {
  pic: 1,
  kepala_sekretariat: 2,
  kasubdit: 3,
  admin: 3,
}

export default function ReviewDetail({
  log,
  entries,
  approvals,
  reviewerRole,
  reviewerId,
}: {
  log: any
  entries: any[]
  approvals: any[]
  reviewerRole: string
  reviewerId: string
}) {
  const [komentar, setKomentar] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  const handleApprove = async () => {
    if (!confirm('Setujui log ini?')) return
    setLoading(true)

    const { error: approvalError } = await supabase
      .from('log_approval')
      .insert({
        log_bulanan_id: log.id,
        reviewer_id: reviewerId,
        role_reviewer: reviewerRole,
        status: 'approved',
        komentar: komentar || null,
        urutan: urutanMap[reviewerRole],
        reviewed_at: new Date().toISOString(),
      })

    if (approvalError) {
      showMsg('Gagal menyimpan approval.', true)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('log_bulanan')
      .update({ status: nextStatus[reviewerRole] })
      .eq('id', log.id)

    if (updateError) {
      showMsg('Gagal update status log.', true)
    } else {
      showMsg('Log berhasil disetujui!')
      setTimeout(() => router.push('/review'), 1500)
    }
    setLoading(false)
  }

  const handleRevisi = async () => {
    if (!komentar.trim()) {
      showMsg('Tulis komentar/alasan revisi dulu!', true)
      return
    }
    if (!confirm('Kembalikan log ini untuk direvisi?')) return
    setLoading(true)

    const { error: approvalError } = await supabase
      .from('log_approval')
      .insert({
        log_bulanan_id: log.id,
        reviewer_id: reviewerId,
        role_reviewer: reviewerRole,
        status: 'revision',
        komentar,
        urutan: urutanMap[reviewerRole],
        reviewed_at: new Date().toISOString(),
      })

    if (approvalError) {
      showMsg('Gagal menyimpan.', true)
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('log_bulanan')
      .update({ status: 'revision' })
      .eq('id', log.id)

    if (updateError) {
      showMsg('Gagal update status.', true)
    } else {
      showMsg('Log dikembalikan untuk revisi!')
      setTimeout(() => router.push('/review'), 1500)
    }
    setLoading(false)
  }

  const canReview =
    (reviewerRole === 'pic' && log.status === 'submitted') ||
    (reviewerRole === 'kepala_sekretariat' && log.status === 'reviewed_pic') ||
    (reviewerRole === 'kasubdit' && log.status === 'verified_kasek') ||
    (reviewerRole === 'admin' && ['submitted', 'reviewed_pic', 'verified_kasek'].includes(log.status))

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 rounded-lg text-sm border bg-green-500/10 border-green-500/20 text-green-400">
          {message}
        </div>
      )}
      {error && (
        <div className="p-3 rounded-lg text-sm border bg-red-500/10 border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Tabel Kegiatan */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">{entries.length} kegiatan</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-28">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Kegiatan</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400">Output</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-28">Kategori</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600 dark:text-zinc-400 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 text-zinc-900 dark:text-white">
                  {new Date(entry.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 text-zinc-900 dark:text-white">
                  <p>{entry.kegiatan}</p>
                  {entry.link_dokumen && (
                    <a href={entry.link_dokumen} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 block">
                      Lihat dokumen →
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500">{entry.output || '-'}</td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{entry.tag_kategori || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${statusColors[entry.status_kegiatan as keyof typeof statusColors]}`}>
                    {entry.status_kegiatan === 'selesai' ? 'Selesai' : entry.status_kegiatan === 'proses' ? 'Proses' : 'Ditunda'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Riwayat Approval */}
      {approvals.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Riwayat Review</p>
          <div className="space-y-2">
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-start gap-3">
                {approval.status === 'approved' ? (
                  <CheckCircle size={16} className="text-green-400 mt-0.5 shrink-0" />
                ) : approval.status === 'revision' ? (
                  <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
                ) : (
                  <Clock size={16} className="text-yellow-400 mt-0.5 shrink-0" />
                )}
                <div>
                  <p className="text-sm text-zinc-900 dark:text-white">
                    {approval.users?.full_name || '-'}
                    <span className="text-zinc-500 text-xs ml-2">({approval.role_reviewer})</span>
                  </p>
                  {approval.komentar && (
                    <p className="text-xs text-zinc-500 mt-0.5">{approval.komentar}</p>
                  )}
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {new Date(approval.reviewed_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Review */}
      {canReview && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <p className="text-sm font-medium text-zinc-900 dark:text-white mb-3">Keputusan Review</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">
                Komentar (wajib jika revisi)
              </label>
              <textarea
                value={komentar}
                onChange={(e) => setKomentar(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tulis komentar atau catatan..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={16} />
                {reviewerRole === 'kasubdit' || reviewerRole === 'admin' ? 'Setujui' : 'Teruskan'}
              </button>
              <button
                onClick={handleRevisi}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle size={16} />
                Minta Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}