import { requireRole } from '@/lib/get-user-role'
import { createAdminClient } from '@/lib/supabase/admin'
import UsersTable from '@/components/admin/users-table'

export default async function AdminUsersPage() {
  await requireRole(['admin'])

  const supabase = createAdminClient()

const { data: users, error } = await supabase
    .from('users')
    .select(`
      *,
      bidang!users_bidang_id_fkey (nama)
    `)
    .order('created_at', { ascending: false })

console.log('users data:', JSON.stringify(users))
console.log('users error:', JSON.stringify(error))

  const { data: bidangList } = await supabase
    .from('bidang')
    .select('*')
    .order('nama')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Manajemen User</h2>
        <p className="text-sm text-zinc-500 mt-1">Kelola user, role, dan bidang</p>
      </div>
      <UsersTable users={users || []} bidangList={bidangList || []} />
    </div>
  )
}