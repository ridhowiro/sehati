import { requireRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import BidangTable from '@/components/admin/bidang-table'

export default async function AdminBidangPage() {
  await requireRole(['admin'])

  const supabase = createAdminClient()

const { data: bidangList, error } = await supabase
    .from('bidang')
    .select('*')
    .order('nama')

const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('is_active', true)
    .order('full_name')
    
    console.log('bidang data:', JSON.stringify(bidangList))
    console.log('bidang error:', JSON.stringify(error))
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Manajemen Bidang</h2>
        <p className="text-sm text-zinc-500 mt-1">Kelola struktur bidang dan assign PIC</p>
      </div>
      <BidangTable bidangList={bidangList || []} users={users || []} />
    </div>
  )
}