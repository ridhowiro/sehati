'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { updateLogStatus } from '@/app/actions/user'

// Libur nasional & cuti bersama Indonesia (Senin–Jumat saja yang berpengaruh)
// Sumber: SKB 3 Menteri. Tanggal berbasis bulan Islam bersifat perkiraan.
const LIBUR_NASIONAL = new Set([
  // 2025
  '2025-01-01', // Tahun Baru Masehi
  '2025-01-27', // Isra Mi'raj
  '2025-01-28', // Cuti bersama Isra Mi'raj
  '2025-01-29', // Tahun Baru Imlek
  '2025-03-28', // Cuti bersama Nyepi
  '2025-03-29', // Nyepi (Saka 1947)
  '2025-03-31', // Idul Fitri 1446 H hari ke-1
  '2025-04-01', // Idul Fitri 1446 H hari ke-2
  '2025-04-02', // Cuti bersama Idul Fitri
  '2025-04-03', // Cuti bersama Idul Fitri
  '2025-04-04', // Cuti bersama Idul Fitri
  '2025-04-07', // Cuti bersama Idul Fitri
  '2025-04-18', // Wafat Isa Al Masih
  '2025-04-20', // Paskah
  '2025-05-01', // Hari Buruh
  '2025-05-12', // Hari Raya Waisak
  '2025-05-13', // Cuti bersama Waisak
  '2025-05-29', // Kenaikan Isa Al Masih
  '2025-06-01', // Hari Lahir Pancasila
  '2025-06-06', // Idul Adha 1446 H
  '2025-06-27', // Tahun Baru Islam 1447 H
  '2025-08-17', // HUT Kemerdekaan RI
  '2025-09-05', // Maulid Nabi 1447 H
  '2025-12-25', // Natal
  '2025-12-26', // Cuti bersama Natal

  // 2026
  '2026-01-01', // Tahun Baru Masehi
  '2026-01-17', // Isra Mi'raj 1447 H
  '2026-02-17', // Tahun Baru Imlek 2577
  '2026-03-19', // Idul Fitri 1447 H hari ke-1
  '2026-03-20', // Idul Fitri 1447 H hari ke-2
  '2026-03-28', // Nyepi (Saka 1948)
  '2026-04-03', // Wafat Isa Al Masih
  '2026-05-01', // Hari Buruh
  '2026-05-14', // Kenaikan Isa Al Masih
  '2026-05-23', // Hari Raya Waisak
  '2026-05-27', // Idul Adha 1447 H
  '2026-06-01', // Hari Lahir Pancasila
  '2026-06-17', // Tahun Baru Islam 1448 H
  '2026-08-17', // HUT Kemerdekaan RI
  '2026-09-26', // Maulid Nabi 1448 H
  '2026-12-25', // Natal
])

function hitungHariKerja(tahun: number, bulan: number): number {
  const daysInMonth = new Date(tahun, bulan, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(tahun, bulan - 1, d)
    const day = date.getDay()
    if (day === 0 || day === 6) continue
    const key = `${tahun}-${String(bulan).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    if (!LIBUR_NASIONAL.has(key)) count++
  }
  return count
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

const statusColors = {
  selesai: 'bg-green-500/10 text-green-400 border-green-500/20',
  proses: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ditunda: 'bg-red-500/10 text-red-400 border-red-500/20',
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

  const showMsg = (msg: string, isError = false) => {
    if (isError) setError(msg)
    else setMessage(msg)
    setTimeout(() => { setMessage(''); setError('') }, 3000)
  }

  const handleApprove = async () => {
    if (!confirm('Setujui log ini?')) return
    setLoading(true)

    const result = await updateLogStatus(
      log.id,
      nextStatus[reviewerRole],
      {
        reviewer_id: reviewerId,
        role_reviewer: reviewerRole,
        komentar: komentar || null,
        urutan: urutanMap[reviewerRole],
      }
    )

    if (result.error) {
      showMsg('Gagal: ' + result.error, true)
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

    const result = await updateLogStatus(
      log.id,
      'revision',
      {
        reviewer_id: reviewerId,
        role_reviewer: reviewerRole,
        komentar,
        urutan: urutanMap[reviewerRole],
      }
    )

    if (result.error) {
      showMsg('Gagal: ' + result.error, true)
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

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4 flex-wrap">
          <p className="text-sm font-medium text-zinc-900 dark:text-white">{entries.length} kegiatan</p>
          {(() => {
            const hariKerja = hitungHariKerja(log.tahun, log.bulan)
            const jumlah = entries.length
            const selisih = jumlah - hariKerja
            const warna = selisih >= 0
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
            return (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${warna}`}>
                {hariKerja} hari kerja
                {selisih >= 0
                  ? ` · +${selisih} (memenuhi)`
                  : ` · ${selisih} (kurang)`}
              </span>
            )
          })()}
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
                    <a
                      href={entry.link_dokumen?.startsWith('http') ? entry.link_dokumen : `https://${entry.link_dokumen}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 mt-1 block"
                    >
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