import { requireRole } from '@/lib/get-user-role'
import { createClient } from '@/lib/supabase/server'
import UsersTable from '@/components/admin/users-table'

export default async function AdminUsersPage() {
  await requireRole(['admin'])

  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select(`
      *,
      bidang (nama)
    `)
    .order('created_at', { ascending: false })

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