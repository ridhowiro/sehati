'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { createNotifikasi } from '@/lib/notifikasi'

export type SplitMode = 'equal' | 'custom'
export type ChargeType = 'equal' | 'custom'

export interface MemberInput {
  user_id?: string
  external_name?: string
  amount: number
}

export interface ChargeInput {
  label: string
  amount: number
  split_type: ChargeType
  custom_members?: { member_index: number; amount: number }[]
}

export interface CreateBillInput {
  title: string
  total_amount: number
  notes?: string
  members: MemberInput[]
  charges: ChargeInput[]
}

export async function createBill(input: CreateBillInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  // Validasi: total member amount harus = total_amount
  // Charges adalah breakdown/biaya tambahan, tidak divalidasi terpisah
  const membersTotal = input.members.reduce((s, m) => s + m.amount, 0)
  if (Math.abs(membersTotal - input.total_amount) > 1) {
    return { error: 'Total tagihan member harus sama dengan total bill' }
  }

  // Insert split_bills
  const { data: bill, error: billErr } = await admin
    .from('split_bills')
    .insert({
      title: input.title,
      total_amount: input.total_amount,
      created_by: user.id,
      notes: input.notes || null,
    })
    .select('id, share_token')
    .single()

  if (billErr || !bill) return { error: billErr?.message ?? 'Gagal membuat bill' }

  // Insert members
  const { data: members, error: membersErr } = await admin
    .from('split_bill_members')
    .insert(
      input.members.map((m) => ({
        split_bill_id: bill.id,
        user_id: m.user_id || null,
        external_name: m.external_name || null,
        amount: m.amount,
      }))
    )
    .select('id, user_id, external_name')

  if (membersErr || !members) return { error: membersErr?.message ?? 'Gagal menambah member' }

  // Insert charges
  for (const charge of input.charges) {
    const { data: chargeRow, error: chargeErr } = await admin
      .from('split_bill_charges')
      .insert({
        split_bill_id: bill.id,
        label: charge.label,
        amount: charge.amount,
        split_type: charge.split_type,
      })
      .select('id')
      .single()

    if (chargeErr || !chargeRow) return { error: chargeErr?.message ?? 'Gagal menambah charge' }

    if (charge.split_type === 'equal') {
      const perMember = charge.amount / members.length
      await admin.from('split_bill_charge_members').insert(
        members.map((m) => ({ charge_id: chargeRow.id, member_id: m.id, amount: perMember }))
      )
    } else if (charge.custom_members && charge.custom_members.length > 0) {
      await admin.from('split_bill_charge_members').insert(
        charge.custom_members.map((cm) => ({
          charge_id: chargeRow.id,
          member_id: members[cm.member_index]?.id,
          amount: cm.amount,
        }))
      )
    }
  }

  // Kirim notifikasi ke internal members (yang punya user_id)
  const { data: creatorData } = await admin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()
  const creatorName = creatorData?.full_name ?? 'Seseorang'

  const internalMembers = members.filter((m) => m.user_id && m.user_id !== user.id)
  if (internalMembers.length > 0) {
    await createNotifikasi(
      internalMembers.map((m) => ({
        user_id: m.user_id!,
        judul: 'Kamu ditagih! 💸',
        pesan: `${creatorName} menambahkanmu ke "${input.title}"`,
        tipe: 'talangin_added' as const,
        link: `/talangin/${bill.id}`,
      }))
    )
  }

  revalidatePath('/talangin')
  return { success: true, id: bill.id }
}

export async function getBills() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  // Bills yang user buat
  const { data: created, error: e1 } = await admin
    .from('split_bills')
    .select(`
      id, title, total_amount, status, created_at, updated_at,
      split_bill_members(id, is_paid, confirmed_by_creator, user_id, external_name, amount)
    `)
    .eq('created_by', user.id)
    .order('created_at', { ascending: false })

  // Bills yang user jadi member (tidak termasuk bill yang dia sendiri buat)
  const { data: memberOf, error: e2 } = await admin
    .from('split_bill_members')
    .select(`
      id, amount, is_paid, confirmed_by_creator,
      split_bills!inner(id, title, total_amount, status, created_at, created_by,
        users!split_bills_created_by_fkey(full_name))
    `)
    .eq('user_id', user.id)
    .neq('split_bills.created_by', user.id)
    .order('created_at', { ascending: false })

  return {
    created: created ?? [],
    memberOf: memberOf ?? [],
  }
}

export async function getBillDetail(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  const { data: bill, error } = await admin
    .from('split_bills')
    .select(`
      id, title, total_amount, notes, status, share_token, created_at, updated_at, created_by,
      users!split_bills_created_by_fkey(full_name, avatar_url),
      split_bill_members(
        id, user_id, external_name, amount, is_paid, paid_at,
        confirmed_by_creator, confirmed_at,
        users(full_name, avatar_url)
      ),
      split_bill_charges(
        id, label, amount, split_type,
        split_bill_charge_members(id, member_id, amount)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !bill) return { error: 'Bill tidak ditemukan' }

  // Cek akses: hanya creator atau member yang bisa lihat
  const isCreator = bill.created_by === user.id
  const isMember = (bill.split_bill_members as any[]).some((m: any) => m.user_id === user.id)
  if (!isCreator && !isMember) return { error: 'Akses ditolak' }

  return { bill, isCreator }
}

export async function claimPaid(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  // Verifikasi member adalah user ini
  const { data: member, error: mErr } = await admin
    .from('split_bill_members')
    .select('id, user_id, split_bill_id, split_bills(title, created_by)')
    .eq('id', memberId)
    .single()

  if (mErr || !member) return { error: 'Member tidak ditemukan' }
  if ((member as any).user_id !== user.id) return { error: 'Bukan tagihan kamu' }

  const { error } = await admin
    .from('split_bill_members')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) return { error: error.message }

  // Notif ke creator
  const bill = (member as any).split_bills
  const { data: claimant } = await admin
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (bill?.created_by && bill.created_by !== user.id) {
    await createNotifikasi({
      user_id: bill.created_by,
      judul: 'Ada yang klaim sudah bayar! 🔔',
      pesan: `${claimant?.full_name ?? 'Seseorang'} bilang sudah bayar di "${bill.title}"`,
      tipe: 'talangin_paid_claim',
      link: `/talangin/${(member as any).split_bill_id}`,
    })
  }

  revalidatePath(`/talangin/${(member as any).split_bill_id}`)
  return { success: true }
}

export async function confirmPayment(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  // Verifikasi creator
  const { data: member, error: mErr } = await admin
    .from('split_bill_members')
    .select('id, user_id, split_bill_id, split_bills(title, created_by)')
    .eq('id', memberId)
    .single()

  if (mErr || !member) return { error: 'Member tidak ditemukan' }
  const bill = (member as any).split_bills
  if (bill?.created_by !== user.id) return { error: 'Hanya creator yang bisa konfirmasi' }

  const { error } = await admin
    .from('split_bill_members')
    .update({
      confirmed_by_creator: true,
      confirmed_at: new Date().toISOString(),
      is_paid: true,
      paid_at: new Date().toISOString(),
    })
    .eq('id', memberId)

  if (error) return { error: error.message }

  // Notif ke member (jika internal)
  if ((member as any).user_id) {
    await createNotifikasi({
      user_id: (member as any).user_id,
      judul: 'Pembayaranmu dikonfirmasi ✅',
      pesan: `Creator mengkonfirmasi kamu sudah bayar di "${bill.title}"`,
      tipe: 'talangin_confirmed',
      link: `/talangin/${(member as any).split_bill_id}`,
    })
  }

  // Cek apakah semua member sudah confirmed → auto settle
  const { data: allMembers } = await admin
    .from('split_bill_members')
    .select('confirmed_by_creator')
    .eq('split_bill_id', (member as any).split_bill_id)

  const allSettled = (allMembers ?? []).every((m: any) => m.confirmed_by_creator)
  if (allSettled) {
    await admin
      .from('split_bills')
      .update({ status: 'settled' })
      .eq('id', (member as any).split_bill_id)
  }

  revalidatePath(`/talangin/${(member as any).split_bill_id}`)
  return { success: true }
}

export async function forceSettle(billId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()

  const { data: bill } = await admin
    .from('split_bills')
    .select('created_by, title, split_bill_members(id, user_id, confirmed_by_creator)')
    .eq('id', billId)
    .single()

  if (!bill) return { error: 'Bill tidak ditemukan' }
  if ((bill as any).created_by !== user.id) return { error: 'Hanya creator yang bisa settle' }

  await admin.from('split_bills').update({ status: 'settled' }).eq('id', billId)

  // Notif semua internal member
  const internalMembers = ((bill as any).split_bill_members ?? []).filter(
    (m: any) => m.user_id && m.user_id !== user.id
  )
  if (internalMembers.length > 0) {
    await createNotifikasi(
      internalMembers.map((m: any) => ({
        user_id: m.user_id,
        judul: 'Bill ditutup 🎉',
        pesan: `"${(bill as any).title}" sudah di-settle oleh creator`,
        tipe: 'talangin_settled' as const,
        link: `/talangin/${billId}`,
      }))
    )
  }

  revalidatePath(`/talangin/${billId}`)
  revalidatePath('/talangin')
  return { success: true }
}

export async function deleteBill(billId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const admin = createAdminClient()
  const { data: bill } = await admin
    .from('split_bills')
    .select('created_by')
    .eq('id', billId)
    .single()

  if (!bill || (bill as any).created_by !== user.id) return { error: 'Akses ditolak' }

  const { error } = await admin.from('split_bills').delete().eq('id', billId)
  if (error) return { error: error.message }

  revalidatePath('/talangin')
  return { success: true }
}

export async function getPublicBill(shareToken: string) {
  const admin = createAdminClient()
  const { data: bill, error } = await admin
    .from('split_bills')
    .select(`
      id, title, total_amount, notes, status, created_at,
      users!split_bills_created_by_fkey(full_name),
      split_bill_members(
        id, user_id, external_name, amount, is_paid, confirmed_by_creator, paid_at,
        users(full_name)
      ),
      split_bill_charges(
        id, label, amount, split_type,
        split_bill_charge_members(id, member_id, amount)
      )
    `)
    .eq('share_token', shareToken)
    .single()

  if (error || !bill) return { error: 'Link tidak valid atau bill tidak ditemukan' }
  return { bill }
}

export async function claimPaidExternal(shareToken: string, memberId: string) {
  const admin = createAdminClient()

  // Verifikasi member milik bill dengan token ini, dan memang external (tidak punya user_id)
  const { data: member, error } = await admin
    .from('split_bill_members')
    .select('id, user_id, is_paid, confirmed_by_creator, split_bill_id, split_bills!inner(title, created_by, share_token)')
    .eq('id', memberId)
    .eq('split_bills.share_token', shareToken)
    .is('user_id', null)
    .single()

  if (error || !member) return { error: 'Member tidak ditemukan atau bukan external member' }
  if ((member as any).confirmed_by_creator) return { error: 'Sudah dikonfirmasi lunas' }
  if ((member as any).is_paid) return { success: true, already: true }

  await admin
    .from('split_bill_members')
    .update({ is_paid: true, paid_at: new Date().toISOString() })
    .eq('id', memberId)

  const bill = (member as any).split_bills
  const { data: extMember } = await admin
    .from('split_bill_members')
    .select('external_name')
    .eq('id', memberId)
    .single()

  // Notif ke creator
  if (bill?.created_by) {
    await createNotifikasi({
      user_id: bill.created_by,
      judul: 'Ada yang klaim sudah bayar! 🔔',
      pesan: `${(extMember as any)?.external_name ?? 'External member'} bilang sudah bayar di "${bill.title}"`,
      tipe: 'talangin_paid_claim',
      link: `/talangin/${(member as any).split_bill_id}`,
    })
  }

  revalidatePath(`/talangin/s/${shareToken}`)
  return { success: true }
}

export async function searchUsers(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id, full_name, avatar_url')
    .ilike('full_name', `%${query}%`)
    .eq('is_active', true)
    .neq('id', user.id)
    .limit(8)

  return data ?? []
}
