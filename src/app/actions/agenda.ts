'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAgenda(data: {
  judul: string
  tanggal: string
  waktu_mulai?: string
  waktu_selesai?: string
  lokasi?: string
  deskripsi?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const { error } = await supabase.from('agenda').insert({
    creator_id: user.id,
    judul: data.judul,
    tanggal: data.tanggal,
    waktu_mulai: data.waktu_mulai || null,
    waktu_selesai: data.waktu_selesai || null,
    lokasi: data.lokasi || null,
    deskripsi: data.deskripsi || null,
  })

  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}

export async function deleteAgenda(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  // Hanya creator atau admin yang boleh hapus
  const { data: agenda } = await supabase
    .from('agenda')
    .select('creator_id')
    .eq('id', id)
    .single()

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!agenda) return { error: 'Agenda tidak ditemukan' }
  if (agenda.creator_id !== user.id && userData?.role !== 'admin') {
    return { error: 'Tidak memiliki akses' }
  }

  const { error } = await supabase.from('agenda').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/agenda')
  return { success: true }
}
