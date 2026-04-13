'use client'

import { useState } from 'react'
import { FileText, Download, BookOpen, Users, Clock, ClipboardList, Calendar, BarChart2, Settings, Wallet } from 'lucide-react'

const fitur = [
  { icon: Clock, title: 'Absensi', desc: 'Check-in/out berbasis geolokasi, koreksi absensi, riwayat harian.' },
  { icon: ClipboardList, title: 'Log Kerja Bulanan', desc: 'Input kegiatan harian, submit, dan approval multi-level.' },
  { icon: FileText, title: 'Pengajuan Izin', desc: 'Ajukan izin, cuti, surat tugas dengan workflow persetujuan.' },
  { icon: Calendar, title: 'Agenda', desc: 'Kalender bersama untuk event dan meeting tim.' },
  { icon: BarChart2, title: 'Laporan & Export', desc: 'Rekap absensi dan log, export ke PDF dan Excel.' },
  { icon: Settings, title: 'Administrasi', desc: 'Kelola user, bidang, konfigurasi kantor, dan hari libur.' },
  { icon: Wallet, title: 'Talangin Dulu 🆕', desc: 'Split bill bareng tim — bagi tagihan makan, transport, atau apapun. Share link ke teman external, notif otomatis ke member internal.' },
]

export default function PanduanPage() {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const React = await import('react')
      const { PanduanPDF } = await import('@/components/pdf/panduan-pdf')

      const blob = await pdf(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(PanduanPDF) as any
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Panduan-SEHATI.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <BookOpen className="text-blue-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Panduan Penggunaan</h1>
            <p className="text-sm text-zinc-500">Sistem Informasi Sekretariat HETI</p>
          </div>
        </div>
      </div>

      {/* Download Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-1">Panduan Lengkap SEHATI</h2>
            <p className="text-blue-100 text-sm mb-4">
              Dokumen panduan lengkap dalam format PDF mencakup semua fitur dan cara penggunaan aplikasi SEHATI.
            </p>
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <span>9 Bab</span>
              <span>•</span>
              <span>Versi 1.0</span>
              <span>•</span>
              <span>April 2026</span>
            </div>
          </div>
          <FileText size={40} className="text-blue-300 shrink-0" />
        </div>
        <button
          onClick={handleDownload}
          disabled={loading}
          className="mt-5 flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-70"
        >
          <Download size={16} />
          {loading ? 'Membuat PDF...' : 'Download PDF'}
        </button>
      </div>

      {/* Ringkasan Fitur */}
      <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-4">Fitur yang Tercakup</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fitur.map(({ icon: Icon, title, desc }) => {
          const isNew = title.includes('🆕')
          return (
            <div key={title} className={`flex gap-3 p-4 rounded-xl border bg-white dark:bg-zinc-900 ${isNew ? 'border-blue-500/40 dark:border-blue-500/30 ring-1 ring-blue-500/20' : 'border-zinc-200 dark:border-zinc-800'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isNew ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Icon size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{title}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Role */}
      <div className="mt-6 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-blue-600" />
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Panduan tersedia untuk semua role</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Karyawan', 'PIC', 'Kepala Sekretariat', 'Kasubdit', 'Admin'].map(role => (
            <span key={role} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full">
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
