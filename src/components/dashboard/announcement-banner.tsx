'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Announcement {
  id: string
  judul: string
  pesan: string
  created_at: string
}

export default function AnnouncementBanner({ userId }: { userId: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [current, setCurrent] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('notifikasi')
        .select('id, judul, pesan, created_at')
        .eq('user_id', userId)
        .eq('tipe', 'pengumuman')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (data && data.length > 0) setAnnouncements(data)
    }
    fetch()
  }, [userId])

  const dismiss = async (id: string) => {
    await supabase.from('notifikasi').update({ is_read: true }).eq('id', id)
    setAnnouncements(prev => {
      const next = prev.filter(a => a.id !== id)
      setCurrent(c => Math.min(c, Math.max(0, next.length - 1)))
      return next
    })
  }

  if (announcements.length === 0) return null

  const ann = announcements[current]

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl px-5 py-4 shadow-md flex gap-3 items-start mb-4">
      <Megaphone size={20} className="shrink-0 mt-0.5 text-blue-100" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{ann.judul}</span>
          {announcements.length > 1 && (
            <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
              {current + 1} / {announcements.length}
            </span>
          )}
        </div>
        <p className="text-sm text-blue-100 mt-0.5 leading-relaxed">{ann.pesan}</p>
        {announcements.length > 1 && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setCurrent(c => (c - 1 + announcements.length) % announcements.length)}
              className="text-xs text-blue-200 hover:text-white transition-colors"
            >
              ← Sebelumnya
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % announcements.length)}
              className="text-xs text-blue-200 hover:text-white transition-colors"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
      <button
        onClick={() => dismiss(ann.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Tutup pengumuman"
      >
        <X size={16} />
      </button>
    </div>
  )
}
