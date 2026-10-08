import { createAdminClient } from '@/lib/supabase/admin'

/** Status log berikutnya setelah di-approve oleh role reviewer */
export const nextLogStatus: Record<string, string> = {
  pic: 'reviewed_pic',
  kepala_sekretariat: 'verified_kasek',
  kasubdit: 'approved',
  admin: 'approved',
}

/** Kumpulan bidang_id yang saat ini punya PIC aktif */
export async function getBidangIdsWithPic(): Promise<Set<string>> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('bidang_id')
    .eq('role', 'pic')
    .eq('is_active', true)
    .not('bidang_id', 'is', null)
  return new Set((data ?? []).map((u: any) => u.bidang_id))
}

/**
 * Apakah reviewer boleh memproses log ini sekarang.
 * PIC ditentukan dari bidang pemilik log saat ini (bukan saat submit),
 * jadi pergantian PIC otomatis berlaku untuk log yang belum diproses.
 * Log 'submitted' milik karyawan tanpa PIC (staff umum / bidang belum ada PIC)
 * diproses langsung oleh Kasek.
 */
export function canReviewLog(
  reviewer: { role: string; bidang_id: string | null },
  log: { status: string; ownerBidangId: string | null },
  bidangWithPic: Set<string>,
): boolean {
  const ownerHasPic = !!log.ownerBidangId && bidangWithPic.has(log.ownerBidangId)

  switch (reviewer.role) {
    case 'admin':
      return ['submitted', 'reviewed_pic', 'verified_kasek'].includes(log.status)
    case 'pic':
      return log.status === 'submitted' && !!reviewer.bidang_id && reviewer.bidang_id === log.ownerBidangId
    case 'kepala_sekretariat':
      return log.status === 'reviewed_pic' || (log.status === 'submitted' && !ownerHasPic)
    case 'kasubdit':
      return log.status === 'verified_kasek'
    default:
      return false
  }
}
