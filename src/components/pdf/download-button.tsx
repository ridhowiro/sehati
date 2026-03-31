'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'

interface DownloadPDFButtonProps {
  log: any
  entries: any[]
  approvals: any[]
  userData: any
}

export default function DownloadPDFButton({ log, entries, approvals, userData }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const QRCode = await import('qrcode')
      const { pdf } = await import('@react-pdf/renderer')
      const { LogPDF } = await import('./log-pdf')

      const baseUrl = window.location.origin
      const verifyUrl = `${baseUrl}/verify/${log.id}`

      const qrDataUrl = await QRCode.default.toDataURL(verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })

      const blob = await pdf(
        <LogPDF
          log={log}
          entries={entries}
          approvals={approvals}
          userData={userData}
          qrDataUrl={qrDataUrl}
          baseUrl={baseUrl}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Log_Bulanan_${userData.full_name}_${log.bulan}_${log.tahun}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Gagal generate PDF')
    }
    setLoading(false)
  }
  return (
    
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
    >
      <FileDown size={16} />
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  )
}