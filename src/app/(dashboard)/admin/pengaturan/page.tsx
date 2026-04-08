import { requireRole } from '@/lib/get-user-role'
import { getMaintenanceMode } from '@/app/actions/app-settings'
import MaintenanceToggle from '@/components/admin/maintenance-toggle'

export default async function AdminPengaturanPage() {
  await requireRole(['admin'])
  const maintenanceMode = await getMaintenanceMode()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Pengaturan Aplikasi</h2>
        <p className="text-sm text-zinc-500 mt-1">Konfigurasi umum aplikasi SEHATI</p>
      </div>
      <MaintenanceToggle initialValue={maintenanceMode} />
    </div>
  )
}
