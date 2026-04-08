'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  ClipboardCheck,
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  ScanFace,
  CircleDollarSign,
} from 'lucide-react'

const STORAGE_KEY = 'sehati_onboarding_done'

const steps = [
  {
    icon: <Sparkles className="text-blue-400" size={32} />,
    title: 'Selamat datang di SEHATI! 👋',
    description:
      'SEHATI adalah Sistem E-Office HETI Terintegrasi — platform untuk memudahkan pengelolaan log bulanan, agenda, dan data kepegawaian PMU HETI. Yuk, kenalan dulu sama fitur-fiturnya!',
  },
  {
    icon: <LayoutDashboard className="text-blue-400" size={32} />,
    title: 'Dashboard',
    description:
      'Halaman utama yang menampilkan ringkasan aktivitas kamu — status log bulanan, agenda terdekat, dan notifikasi penting. Semua ada di sini.',
  },
  {
    icon: <BookOpen className="text-blue-400" size={32} />,
    title: 'Log Bulanan',
    description:
      'Catat kegiatan kerja kamu setiap bulan di sini. Isi aktivitas, upload lampiran, lalu kirim untuk direview oleh atasan. Gampang dan rapi!',
  },
  {
    icon: <ClipboardCheck className="text-blue-400" size={32} />,
    title: 'Review Log',
    description:
      'Khusus untuk PIC, Kasubdit, dan Kepala Sekretariat — kamu bisa melihat dan memberikan approval atas log bulanan anggota tim di sini.',
  },
  {
    icon: <Calendar className="text-blue-400" size={32} />,
    title: 'Agenda Kegiatan',
    description:
      'Lihat dan catat agenda kegiatan PMU HETI. Semua jadwal penting tersimpan di satu tempat supaya tidak ada yang terlewat.',
  },
  {
    icon: <ScanFace className="text-blue-400" size={32} />,
    title: 'Absensi Digital dengan Geotag',
    description:
      'Fitur absensi digital dengan geotag memungkinkan kamu untuk melakukan absensi secara online dengan lokasi yang terverifikasi. Cukup buka aplikasi, lakukan absensi, dan sistem akan mencatat lokasi kamu saat itu. Praktis dan efisien untuk memastikan kehadiran di mana pun.',
  },
    {
    icon: <CircleDollarSign className="text-blue-400" size={32} />,
    title: 'Fitur Keuangan Pribadi (Coming Soon)',
    description:
      'Kelola keuangan pribadimu dengan mudah melalui SEHATI. Catat data dan pantau keuanganmu, dan dapatkan laporan keuangan yang akurat setiap bulannya.',
  },
  {
    icon: <span className="text-4xl">🚀</span>,
    title: 'Siap mulai!',
    description:
      'Kamu sudah siap menggunakan SEHATI. Kalau ada pertanyaan atau butuh bantuan, hubungi admin SEHATI ya. Selamat bekerja dan semoga harimu menyenangkan! 😊',
  },
]

export default function WelcomeModal({
  open,
  onClose,
}: {
  open?: boolean
  onClose?: () => void
} = {}) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  const isControlled = open !== undefined

  useEffect(() => {
    if (!isControlled && !localStorage.getItem(STORAGE_KEY)) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    if (isControlled) {
      setVisible(open)
      if (open) setStep(0)
    }
  }, [open])

  const finish = () => {
    if (!isControlled) localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
    onClose?.()
  }

  if (!visible) return null

  const current = steps[step]
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step ? 'w-6 bg-blue-500' : 'w-1.5 bg-zinc-700'
                )}
              />
            ))}
          </div>
          <button
            onClick={finish}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 min-h-[200px] flex flex-col items-center text-center">
          <div className="mb-4">{current.icon}</div>
          <h2 className="text-white font-semibold text-xl mb-3 leading-snug">
            {current.title}
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          {!isFirst ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors"
            >
              <ChevronLeft size={16} />
              Kembali
            </button>
          ) : (
            <button
              onClick={finish}
              className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
            >
              Lewati
            </button>
          )}

          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors"
          >
            {isLast ? 'Mulai sekarang' : 'Lanjut'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
