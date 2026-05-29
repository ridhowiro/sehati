'use server'

import { requireRole } from '@/lib/get-user-role'
import { createNotifikasi } from '@/lib/notifikasi'
import { createAdminClient } from '@/lib/supabase/admin'

export async function kirimPengumuman(judul: string, pesan: string) {
  await requireRole(['admin', 'kepala_sekretariat'])

  if (!judul.trim() || !pesan.trim()) {
    throw new Error('Judul dan pesan tidak boleh kosong')
  }

  const supabase = createAdminClient()
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('is_active', true)

  if (!users || users.length === 0) return { count: 0 }

  const notifs = users.map((u: { id: string }) => ({
    user_id: u.id,
    judul: judul.trim(),
    pesan: pesan.trim(),
    tipe: 'pengumuman' as const,
  }))

  await createNotifikasi(notifs)

  return { count: users.length }
}
