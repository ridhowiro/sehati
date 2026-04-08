'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotifikasi, getPicByBidang } from '@/lib/notifikasi'

const bulanNames = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export async function submitLog(logId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase
    .from('log_bulanan')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', logId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Kirim notifikasi ke PIC bidang user
  const adminSupabase = createAdminClient()
  const { data: userData } = await adminSupabase
    .from('users')
    .select('full_name, email, bidang_id')
    .eq('id', user.id)
    .single()

  const { data: log } = await adminSupabase
    .from('log_bulanan')
    .select('bulan, tahun')
    .eq('id', logId)
    .single()

  if (userData && log) {
    const nama = userData.full_name || userData.email || 'Karyawan'
    const periode = `${bulanNames[log.bulan]} ${log.tahun}`
    const link = `/review/${logId}`

    const picIds = userData.bidang_id
      ? await getPicByBidang(userData.bidang_id)
      : []

    if (picIds.length > 0) {
      await createNotifikasi(picIds.map(id => ({
        user_id: id,
        judul: 'Log Menunggu Review',
        pesan: `${nama} mengajukan log ${periode} untuk direview.`,
        tipe: 'log_submitted' as const,
        link,
      })))
    }
  }

  revalidatePath('/log')
  return { success: true }
}
