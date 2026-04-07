import { Cake } from 'lucide-react'

interface BirthdayPerson {
  user_id: string
  full_name: string
  avatar_url: string | null
  tanggal_lahir: string
}

function getAge(tanggalLahir: string): number {
  const today = new Date()
  const born = new Date(tanggalLahir)
  let age = today.getFullYear() - born.getFullYear()
  const m = today.getMonth() - born.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < born.getDate())) age--
  return age
}

export default function BirthdayCard({
  birthdays,
  currentUserId,
}: {
  birthdays: BirthdayPerson[]
  currentUserId: string
}) {
  return (
    <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-yellow-500/10 border border-pink-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center">
          <Cake size={15} className="text-pink-400" />
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white">Ulang Tahun Hari Ini 🎂</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {birthdays.map((b) => {
          const isMe = b.user_id === currentUserId
          const age = getAge(b.tanggal_lahir)
          return (
            <div
              key={b.user_id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                isMe
                  ? 'bg-pink-500/15 border-pink-500/30 text-pink-300'
                  : 'bg-white/50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
              }`}
            >
              <span className="font-medium">{b.full_name}</span>
              <span className="text-xs opacity-60">· {age} tahun</span>
              {isMe && <span className="text-xs font-semibold text-pink-400">(kamu!)</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
