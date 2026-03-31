'use client'

import { useState, useEffect } from 'react'

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // Fetch waktu server saat pertama load
    fetch('/api/time')
      .then(res => res.json())
      .then(data => {
        const serverTime = new Date(data.time)
        setNow(serverTime)

        // Setelah dapat waktu server, increment setiap detik
        const timer = setInterval(() => {
          setNow(prev => prev ? new Date(prev.getTime() + 1000) : new Date())
        }, 1000)

        return () => clearInterval(timer)
      })
  }, [])

  if (!now) return (
    <div className="text-left">
      <p className="text-sm font-medium dark:text-white text-zinc-900">--:--:--</p>
      <p className="text-xs text-zinc-500">Loading...</p>
    </div>
  )

  const hari = now.toLocaleDateString('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' })
  const tanggal = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })
  const hours = String(now.getUTCHours() + 7 > 23 ? now.getUTCHours() + 7 - 24 : now.getUTCHours() + 7).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')

  return (
    <div className="text-left">
      <p className="text-sm font-medium dark:text-white text-zinc-900">{hours}:{minutes}:{seconds}</p>
      <p className="text-xs text-zinc-500">{hari}, {tanggal}</p>
    </div>
  )
}