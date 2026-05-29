import { requireRole } from '@/lib/get-user-role'
import AnnouncementForm from '@/components/admin/announcement-form'

export default async function PengumumanPage() {
  await requireRole(['admin', 'kepala_sekretariat'])

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Pengumuman</h2>
        <p className="text-sm text-zinc-500 mt-1">Kirim pengumuman ke seluruh pengguna aktif sistem</p>
      </div>
      <AnnouncementForm />
    </div>
  )
}
