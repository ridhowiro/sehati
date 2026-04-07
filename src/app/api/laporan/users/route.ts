import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userData } = await supabase.from('users').select('role, bidang_id').eq('id', user.id).single()
  if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const bulan = Number(req.nextUrl.searchParams.get('bulan'))
  const tahun = Number(req.nextUrl.searchParams.get('tahun'))
  if (!bulan || !tahun) return NextResponse.json({ error: 'bulan dan tahun wajib diisi' }, { status: 400 })

  const adminSupabase = createAdminClient()
  const role = userData.role

  // Tentukan allowed user IDs berdasarkan role
  let allowedIds: string[] = []
  if (role === 'karyawan') {
    allowedIds = [user.id]
  } else if (role === 'pic') {
    if (!userData.bidang_id) return NextResponse.json([])
    const { data } = await adminSupabase.from('users').select('id').eq('bidang_id', userData.bidang_id)
    allowedIds = (data || []).map((u: any) => u.id)
  } else {
    const { data } = await adminSupabase.from('users').select('id')
    allowedIds = (data || []).map((u: any) => u.id)
  }

  if (allowedIds.length === 0) return NextResponse.json([])

  const startDate = `${tahun}-${String(bulan).padStart(2, '0')}-01`
  const lastDay = new Date(tahun, bulan, 0).getDate()
  const endDate = `${tahun}-${String(bulan).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [absensiRes, logRes] = await Promise.all([
    adminSupabase.from('absensi').select('user_id').in('user_id', allowedIds).gte('tanggal', startDate).lte('tanggal', endDate),
    adminSupabase.from('log_bulanan').select('user_id').in('user_id', allowedIds).eq('bulan', bulan).eq('tahun', tahun),
  ])

  const userIds = new Set<string>([
    ...(absensiRes.data || []).map((r: any) => r.user_id),
    ...(logRes.data || []).map((r: any) => r.user_id),
  ])

  if (userIds.size === 0) return NextResponse.json([])

  const { data } = await adminSupabase
    .from('users')
    .select('id, full_name, bidang:bidang(nama)')
    .in('id', Array.from(userIds))
    .order('full_name')

  return NextResponse.json(
    (data || []).map((u: any) => ({
      id: u.id,
      full_name: u.full_name,
      bidang_nama: u.bidang?.nama || null,
    }))
  )
}
