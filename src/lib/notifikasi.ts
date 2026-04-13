import { createAdminClient } from '@/lib/supabase/admin'

type NotifTipe =
  | 'log_submitted'
  | 'log_reviewed_pic'
  | 'log_verified_kasek'
  | 'log_approved'
  | 'log_revision'
  | 'izin_diajukan'
  | 'izin_diproses'
  | 'cuti_approved'
  | 'cuti_rejected'
  | 'umum'
  | 'talangin_added'
  | 'talangin_paid_claim'
  | 'talangin_confirmed'
  | 'talangin_settled'

interface NotifPayload {
  user_id: string
  judul: string
  pesan: string
  tipe: NotifTipe
  link?: string
}

export async function createNotifikasi(payload: NotifPayload | NotifPayload[]) {
  const supabase = createAdminClient()
  const data = Array.isArray(payload) ? payload : [payload]
  if (data.length === 0) return
  await supabase.from('notifikasi').insert(data)
}

/** Cari semua user dengan role tertentu */
export async function getUsersByRole(role: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('role', role)
    .eq('is_active', true)
  return (data ?? []).map((u: any) => u.id)
}

/** Cari PIC dari bidang tertentu */
export async function getPicByBidang(bidangId: string): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'pic')
    .eq('bidang_id', bidangId)
    .eq('is_active', true)
  return (data ?? []).map((u: any) => u.id)
}
