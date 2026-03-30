'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

interface CreateLogButtonProps {
  userId: string
  bulan: number
  tahun: number
}

export default function CreateLogButton({ userId, bulan, tahun }: CreateLogButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleCreate = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('log_bulanan')
      .insert({
        user_id: userId,
        bulan,
        tahun,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      alert('Gagal membuat log: ' + error.message)
      setLoading(false)
      return
    }

    router.push(`/log/${data.id}`)
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <Plus size={16} />
      {loading ? 'Membuat...' : `Buat Log ${bulanNames[bulan]} ${tahun}`}
    </button>
  )
}