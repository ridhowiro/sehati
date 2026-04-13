import { getPublicBill } from '@/app/actions/talangin'
import { formatRupiah, formatDate } from '@/lib/format'
import { CheckCircle2, Clock, Receipt, Users } from 'lucide-react'
import ExternalClaimButton from '@/components/talangin/external-claim-button'

export default async function PublicBillPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await getPublicBill(token)

  if ('error' in result) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-xl font-semibold text-white mb-2">Link Tidak Valid</h1>
          <p className="text-zinc-500 text-sm">{result.error}</p>
        </div>
      </div>
    )
  }

  const bill = result.bill as any
  const members: any[] = bill.split_bill_members ?? []
  const charges: any[] = bill.split_bill_charges ?? []
  const confirmedCount = members.filter((m) => m.confirmed_by_creator).length
  const isSettled = bill.status === 'settled'

  // Map member id → nama
  const memberNameMap: Record<string, string> = {}
  for (const m of members) {
    memberNameMap[m.id] = m.users?.full_name ?? m.external_name ?? 'Seseorang'
  }

  // Deteksi per_item mode: semua charges custom
  const isItemMode = charges.length > 0 && charges.every((c: any) => c.split_type === 'custom')

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <span className="text-sm">💸</span>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Talangin Dulu</p>
            <p className="text-xs text-zinc-500">SEHATI</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Bill summary */}
        <div className="p-5 rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {isSettled ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-800">
                    <CheckCircle2 size={11} /> Settled
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-800">
                    <Clock size={11} /> Open
                  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold text-white">{bill.title}</h1>
              <p className="text-sm text-zinc-500 mt-0.5">
                Tagihan dari <span className="text-zinc-400">{bill.users?.full_name ?? 'Seseorang'}</span>
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">{formatDate(bill.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-white">{formatRupiah(bill.total_amount)}</p>
              <p className="text-xs text-zinc-500">{confirmedCount}/{members.length} lunas</p>
            </div>
          </div>

          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: members.length > 0 ? `${(confirmedCount / members.length) * 100}%` : '0%' }}
            />
          </div>

          {bill.notes && (
            <p className="text-sm text-zinc-400 p-3 rounded-lg bg-zinc-800">{bill.notes}</p>
          )}
        </div>

        {/* Daftar Tagihan per member */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-medium text-white flex items-center gap-2 text-sm">
              <Users size={15} /> Daftar Tagihan
            </h2>
          </div>
          {members.map((m: any) => {
            const name = m.users?.full_name ?? m.external_name ?? 'Seseorang'
            const confirmed = m.confirmed_by_creator
            const claimed = m.is_paid

            // Item pesanan member ini (dari charges)
            const myItems = isItemMode
              ? charges.filter((c: any) =>
                  (c.split_bill_charge_members ?? []).some((cm: any) => cm.member_id === m.id)
                )
              : []

            return (
              <div key={m.id} className="px-4 py-3 border-b border-zinc-800 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <div className="shrink-0">
                        {confirmed ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle2 size={12} /> Lunas
                          </span>
                        ) : claimed ? (
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-400">
                            <Clock size={12} /> Menunggu konfirmasi
                          </span>
                        ) : m.user_id === null && !isSettled ? (
                          // External member yang belum bayar: tampilkan tombol
                          <ExternalClaimButton
                            shareToken={token}
                            memberId={m.id}
                            memberName={m.external_name ?? 'External'}
                          />
                        ) : (
                          <span className="text-xs text-zinc-500">Belum bayar</span>
                        )}
                      </div>
                    </div>

                    {/* Item breakdown jika per_item mode */}
                    {myItems.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {myItems.map((c: any) => {
                          const myShare = (c.split_bill_charge_members ?? []).find(
                            (cm: any) => cm.member_id === m.id
                          )
                          const sharedWith = (c.split_bill_charge_members ?? []).length
                          return (
                            <div key={c.id} className="flex justify-between text-xs text-zinc-500">
                              <span>
                                {c.label}
                                {sharedWith > 1 && (
                                  <span className="ml-1 text-zinc-600">(1/{sharedWith})</span>
                                )}
                              </span>
                              <span>{formatRupiah(myShare?.amount ?? 0)}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <p className="text-sm font-semibold text-zinc-300 mt-1">{formatRupiah(m.amount)}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charges biasa (bukan per_item) */}
        {charges.length > 0 && !isItemMode && (
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900">
            <h2 className="font-medium text-white flex items-center gap-2 mb-3 text-sm">
              <Receipt size={15} /> Biaya Tambahan
            </h2>
            <div className="space-y-2">
              {charges.map((c: any) => (
                <div key={c.id} className="flex justify-between text-sm">
                  <span className="text-zinc-400">{c.label}</span>
                  <span className="text-zinc-300">{formatRupiah(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info konfirmasi */}
        <div className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 text-center">
          <p className="text-sm text-zinc-400">
            Sudah transfer? Konfirmasi ke{' '}
            <span className="text-white font-medium">{bill.users?.full_name ?? 'creator'}</span>{' '}
            dan minta untuk mengkonfirmasi pembayaranmu.
          </p>
        </div>

        <p className="text-center text-xs text-zinc-600 pb-4">
          Powered by SEHATI · Talangin Dulu
        </p>
      </div>
    </div>
  )
}
