'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBill, searchUsers } from '@/app/actions/talangin'
import { formatRupiah } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Plus, X, Search, Users, Receipt, Loader2, ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

type UserResult = { id: string; full_name: string; avatar_url: string | null }
type SplitMode = 'equal' | 'custom' | 'per_item'

interface LocalMember {
  _key: string
  _name: string
  _type: 'internal' | 'external'
  user_id?: string
  external_name?: string
  amount: number
}

// Mode per item: setiap item punya label, harga, dan daftar member yang ikut (split rata antar yang ikut)
interface LocalItem {
  _key: string
  label: string
  amount: number
  // keys of members that share this item
  memberKeys: string[]
}

interface Props {
  creatorId: string
  creatorName: string
}

export default function CreateBillForm({ creatorId, creatorName }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [splitMode, setSplitMode] = useState<SplitMode>('equal')

  // Creator otomatis masuk sebagai member pertama
  const [members, setMembers] = useState<LocalMember[]>([
    { _key: creatorId, _name: creatorName, _type: 'internal', user_id: creatorId, amount: 0 },
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [externalName, setExternalName] = useState('')

  // Mode equal/custom: total manual
  const [totalAmount, setTotalAmount] = useState('')

  // Mode per item: daftar item
  const [items, setItems] = useState<LocalItem[]>([])

  const [error, setError] = useState('')

  // ─── Search users ───────────────────────────────────────────
  const performSearch = async (q: string) => {
    if (q.trim().length < 2) { setSearchResults([]); return }
    setSearchLoading(true)
    const results = await searchUsers(q)
    setSearchResults((results as UserResult[]).filter((r) => !members.some((m) => m.user_id === r.id)))
    setSearchLoading(false)
  }

  const addInternalMember = (user: UserResult) => {
    const next: LocalMember = { _key: user.id, _name: user.full_name, _type: 'internal', user_id: user.id, amount: 0 }
    const nextMembers = [...members, next]
    setMembers(nextMembers)
    setSearchQuery('')
    setSearchResults([])
    if (splitMode === 'equal') recalcEqual(nextMembers)
  }

  const addExternalMember = () => {
    if (!externalName.trim()) return
    const key = `ext_${Date.now()}`
    const next: LocalMember = { _key: key, _name: externalName.trim(), _type: 'external', external_name: externalName.trim(), amount: 0 }
    const nextMembers = [...members, next]
    setMembers(nextMembers)
    setExternalName('')
    if (splitMode === 'equal') recalcEqual(nextMembers)
  }

  const removeMember = (key: string) => {
    const next = members.filter((m) => m._key !== key)
    setMembers(next)
    // Juga hapus dari semua item
    setItems((prev) => prev.map((it) => ({ ...it, memberKeys: it.memberKeys.filter((k) => k !== key) })))
    if (splitMode === 'equal') recalcEqual(next)
  }

  // ─── Mode equal ─────────────────────────────────────────────
  const recalcEqual = (mems: LocalMember[]) => {
    const total = parseFloat(totalAmount) || 0
    if (!total || mems.length === 0) return
    const per = total / mems.length
    setMembers(mems.map((m) => ({ ...m, amount: per })))
  }

  const handleTotalChange = (val: string) => {
    setTotalAmount(val)
    if (splitMode === 'equal' && members.length > 0) {
      const total = parseFloat(val) || 0
      const per = total / members.length
      setMembers((prev) => prev.map((m) => ({ ...m, amount: per })))
    }
  }

  // ─── Mode per item ──────────────────────────────────────────
  const addItem = () => {
    setItems((prev) => [...prev, { _key: `item_${Date.now()}`, label: '', amount: 0, memberKeys: [] }])
  }

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it._key !== key))
  }

  const updateItem = (key: string, field: 'label' | 'amount', val: string | number) => {
    setItems((prev) => prev.map((it) => it._key === key ? { ...it, [field]: val } : it))
  }

  const toggleItemMember = (itemKey: string, memberKey: string) => {
    setItems((prev) => prev.map((it) => {
      if (it._key !== itemKey) return it
      const has = it.memberKeys.includes(memberKey)
      return { ...it, memberKeys: has ? it.memberKeys.filter((k) => k !== memberKey) : [...it.memberKeys, memberKey] }
    }))
  }

  // Hitung amount per member dari items (dibagi rata per item antar yang ikut)
  const calcMemberAmountsFromItems = (): Record<string, number> => {
    const totals: Record<string, number> = {}
    for (const it of items) {
      if (it.memberKeys.length === 0 || !it.amount) continue
      const share = it.amount / it.memberKeys.length
      for (const mk of it.memberKeys) {
        totals[mk] = (totals[mk] ?? 0) + share
      }
    }
    return totals
  }

  const itemsGrandTotal = items.reduce((s, it) => s + (it.amount || 0), 0)
  const memberAmountsFromItems = calcMemberAmountsFromItems()

  // ─── Summary values ─────────────────────────────────────────
  const totalNum = splitMode === 'per_item' ? itemsGrandTotal : (parseFloat(totalAmount) || 0)
  const membersTotal = splitMode === 'per_item'
    ? Object.values(memberAmountsFromItems).reduce((s, v) => s + v, 0)
    : members.reduce((s, m) => s + (m.amount || 0), 0)
  const diff = totalNum - membersTotal

  // ─── Submit ─────────────────────────────────────────────────
  const handleSubmit = () => {
    setError('')
    if (!title.trim()) { setError('Judul harus diisi'); return }
    if (members.length === 0) { setError('Tambah minimal 1 member'); return }

    if (splitMode === 'per_item') {
      if (items.length === 0) { setError('Tambah minimal 1 item'); return }
      const unassigned = items.filter((it) => it.amount > 0 && it.memberKeys.length === 0)
      if (unassigned.length > 0) { setError(`Item "${unassigned[0].label || 'tanpa nama'}" belum di-assign ke siapa`); return }

      const amounts = calcMemberAmountsFromItems()

      startTransition(async () => {
        const result = await createBill({
          title: title.trim(),
          total_amount: itemsGrandTotal,
          notes: notes.trim() || undefined,
          members: members.map((m) => ({
            user_id: m.user_id,
            external_name: m.external_name,
            amount: amounts[m._key] ?? 0,
          })),
          // Simpan tiap item sebagai charge custom untuk breakdown di detail
          charges: items.filter((it) => it.amount > 0 && it.memberKeys.length > 0).map((it) => ({
            label: it.label || 'Item',
            amount: it.amount,
            split_type: 'custom' as const,
            custom_members: it.memberKeys.map((mk) => ({
              member_index: members.findIndex((m) => m._key === mk),
              amount: it.amount / it.memberKeys.length,
            })),
          })),
        })
        if ('error' in result) { setError(result.error ?? 'Terjadi kesalahan'); return }
        router.push(`/talangin/${result.id}`)
      })
      return
    }

    // equal / custom mode
    const total = parseFloat(totalAmount)
    if (!total || total <= 0) { setError('Total amount harus diisi'); return }
    if (Math.abs(membersTotal - total) > 1) {
      setError(`Total member ${formatRupiah(membersTotal)} belum sama dengan total bill ${formatRupiah(total)}`)
      return
    }

    startTransition(async () => {
      const result = await createBill({
        title: title.trim(),
        total_amount: total,
        notes: notes.trim() || undefined,
        members: members.map((m) => ({
          user_id: m.user_id,
          external_name: m.external_name,
          amount: m.amount,
        })),
        charges: [],
      })
      if ('error' in result) { setError(result.error ?? 'Terjadi kesalahan'); return }
      router.push(`/talangin/${result.id}`)
    })
  }

  // JSX reusable untuk input member (inline, bukan nested component agar tidak remount)
  const memberSearchJSX = (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); performSearch(e.target.value) }}
          placeholder="Cari user SEHATI..."
          className="w-full pl-8 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
        {(searchResults.length > 0 || searchLoading) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 overflow-hidden">
            {searchLoading ? (
              <div className="p-3 text-center text-zinc-500 text-sm">Mencari...</div>
            ) : searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => addInternalMember(u)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-sm text-left transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white shrink-0">
                  {u.full_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-zinc-900 dark:text-white">{u.full_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={externalName}
          onChange={(e) => setExternalName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addExternalMember()}
          placeholder="Nama teman (external)..."
          className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
        />
        <button onClick={addExternalMember} className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <Link href="/talangin" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Kembali
      </Link>

      {/* Bill Info */}
      <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <h3 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
          <Receipt size={16} /> Detail Bill
        </h3>
        <div>
          <label className="block text-sm text-zinc-500 mb-1">Judul Bill *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Makan siang kantor, bensin perjalanan, dll"
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label className="block text-sm text-zinc-500 mb-1">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Info tambahan..."
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
          />
        </div>
      </div>

      {/* Mode selector */}
      <div className="p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex gap-1">
        {([
          { key: 'equal', label: 'Rata', desc: 'Dibagi sama rata' },
          { key: 'custom', label: 'Custom', desc: 'Atur manual per orang' },
          { key: 'per_item', label: 'Per Item', desc: 'Assign item ke orangnya' },
        ] as { key: SplitMode; label: string; desc: string }[]).map(({ key, label, desc }) => (
          <button
            key={key}
            onClick={() => {
              setSplitMode(key)
              if (key === 'equal' && members.length > 0 && parseFloat(totalAmount) > 0) {
                const per = parseFloat(totalAmount) / members.length
                setMembers((prev) => prev.map((m) => ({ ...m, amount: per })))
              }
            }}
            className={cn(
              'flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors text-center',
              splitMode === key
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            )}
          >
            <div>{label}</div>
            <div className={cn('text-xs mt-0.5 font-normal', splitMode === key ? 'text-zinc-500' : 'text-zinc-600')}>{desc}</div>
          </button>
        ))}
      </div>

      {/* ── MODE: EQUAL / CUSTOM ── */}
      {(splitMode === 'equal' || splitMode === 'custom') && (
        <>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div>
              <label className="block text-sm text-zinc-500 mb-1">Total Amount *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">Rp</span>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <h3 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Users size={16} /> Member ({members.length})
            </h3>
            {memberSearchJSX}
            {members.length > 0 && (
              <div className="space-y-2 pt-1">
                {members.map((m) => (
                  <div key={m._key} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
                    <div className="w-7 h-7 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white shrink-0">
                      {m._name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-900 dark:text-white truncate">{m._name}</p>
                      <p className="text-xs text-zinc-500">{m._type === 'external' ? 'External' : 'Internal'}</p>
                    </div>
                    {splitMode === 'custom' ? (
                      <div className="relative w-28">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">Rp</span>
                        <input
                          type="number"
                          value={m.amount || ''}
                          onChange={(e) => setMembers((prev) => prev.map((x) => x._key === m._key ? { ...x, amount: parseFloat(e.target.value) || 0 } : x))}
                          className="w-full pl-7 pr-2 py-1 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-zinc-400 w-28 text-right">{formatRupiah(m.amount)}</span>
                    )}
                    <button onClick={() => removeMember(m._key)} className="text-zinc-500 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MODE: PER ITEM ── */}
      {splitMode === 'per_item' && (
        <>
          {/* Step 1: tambah member dulu */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <h3 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
              <Users size={16} /> 1. Tambah Member ({members.length})
            </h3>
            {memberSearchJSX}
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {members.map((m) => (
                  <div key={m._key} className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <div className="w-5 h-5 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white shrink-0">
                      {m._name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-zinc-700 dark:text-zinc-300 max-w-24 truncate">{m._name}</span>
                    <button onClick={() => removeMember(m._key)} className="text-zinc-400 hover:text-red-400 transition-colors ml-0.5">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: tambah item & assign */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-zinc-900 dark:text-white flex items-center gap-2">
                <ShoppingBag size={16} /> 2. Tambah Item
              </h3>
              <button
                onClick={addItem}
                disabled={members.length === 0}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-40 transition-colors"
              >
                <Plus size={13} /> Tambah Item
              </button>
            </div>

            {members.length === 0 && (
              <p className="text-xs text-zinc-500 italic">Tambah member dulu sebelum input item</p>
            )}

            {items.length === 0 && members.length > 0 && (
              <p className="text-xs text-zinc-500">Belum ada item. Klik "Tambah Item" untuk mulai.</p>
            )}

            <div className="space-y-3">
              {items.map((it) => (
                <div key={it._key} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 space-y-2.5">
                  {/* Label + harga */}
                  <div className="flex gap-2 items-center">
                    <input
                      value={it.label}
                      onChange={(e) => updateItem(it._key, 'label', e.target.value)}
                      placeholder="Nama item (Nasi goreng, Es teh, dll)"
                      className="flex-1 px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                    />
                    <div className="relative w-28 shrink-0">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">Rp</span>
                      <input
                        type="number"
                        value={it.amount || ''}
                        onChange={(e) => updateItem(it._key, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full pl-7 pr-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
                      />
                    </div>
                    <button onClick={() => removeItem(it._key)} className="text-zinc-500 hover:text-red-400 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Assign ke siapa */}
                  <div>
                    <p className="text-xs text-zinc-500 mb-1.5">Dibayar oleh:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {members.map((m) => {
                        const active = it.memberKeys.includes(m._key)
                        return (
                          <button
                            key={m._key}
                            onClick={() => toggleItemMember(it._key, m._key)}
                            className={cn(
                              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                              active
                                ? 'bg-zinc-700 border-zinc-500 text-white'
                                : 'bg-transparent border-zinc-600 text-zinc-500 hover:border-zinc-400 hover:text-zinc-300'
                            )}
                          >
                            <div className={cn('w-4 h-4 rounded-full flex items-center justify-center text-xs shrink-0', active ? 'bg-zinc-500' : 'bg-zinc-700')}>
                              {m._name.charAt(0).toUpperCase()}
                            </div>
                            {m._name.split(' ')[0]}
                            {active && it.memberKeys.length > 1 && (
                              <span className="text-zinc-400">({formatRupiah(it.amount / it.memberKeys.length)})</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {it.memberKeys.length === 0 && it.amount > 0 && (
                      <p className="text-xs text-orange-400 mt-1">⚠ Belum di-assign ke siapa</p>
                    )}
                    {it.memberKeys.length > 0 && (
                      <p className="text-xs text-zinc-600 mt-1">
                        {it.memberKeys.length > 1
                          ? `Dibagi rata → ${formatRupiah(it.amount / it.memberKeys.length)}/orang`
                          : `Ditanggung penuh oleh ${members.find((m) => m._key === it.memberKeys[0])?._name.split(' ')[0]}`
                        }
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ringkasan per member */}
          {items.length > 0 && members.length > 0 && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <h3 className="font-medium text-zinc-900 dark:text-white text-sm">Ringkasan Tagihan</h3>
              {members.map((m) => {
                const amt = memberAmountsFromItems[m._key] ?? 0
                // item apa aja yang dia punya
                const myItems = items.filter((it) => it.memberKeys.includes(m._key))
                return (
                  <div key={m._key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs text-white shrink-0">
                          {m._name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-zinc-800 dark:text-zinc-200">{m._name}</span>
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white">{formatRupiah(amt)}</span>
                    </div>
                    {myItems.length > 0 && (
                      <div className="ml-8 space-y-0.5">
                        {myItems.map((it) => (
                          <div key={it._key} className="flex justify-between text-xs text-zinc-500">
                            <span>{it.label || 'Item'}{it.memberKeys.length > 1 ? ` (1/${it.memberKeys.length})` : ''}</span>
                            <span>{formatRupiah(it.amount / it.memberKeys.length)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700 text-sm font-medium">
                <span className="text-zinc-500">Total</span>
                <span className="text-zinc-900 dark:text-white">{formatRupiah(itemsGrandTotal)}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary balance (equal/custom) */}
      {(splitMode === 'equal' || splitMode === 'custom') && totalNum > 0 && (
        <div className={cn(
          'p-4 rounded-xl border',
          Math.abs(diff) < 1 ? 'border-green-800 bg-green-900/10' : 'border-red-800 bg-red-900/10'
        )}>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Bill</span>
              <span className="text-zinc-300">{formatRupiah(totalNum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Total Member</span>
              <span className="text-zinc-300">{formatRupiah(membersTotal)}</span>
            </div>
            <div className="pt-1 border-t border-zinc-700">
              <span className={Math.abs(diff) < 1 ? 'text-green-400' : 'text-red-400'}>
                {Math.abs(diff) < 1 ? 'Sudah balance ✓' : `Selisih: ${formatRupiah(Math.abs(diff))}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-900/20 border border-red-800 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Link href="/talangin" className="flex-1 py-2.5 text-center rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">
          Batal
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="flex-1 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? 'Menyimpan...' : 'Buat Bill'}
        </button>
      </div>
    </div>
  )
}
