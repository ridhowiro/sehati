'use client'

import { useState, useTransition } from 'react'
import { setMaintenanceMode } from '@/app/actions/app-settings'

export default function MaintenanceToggle({ initialValue }: { initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const newValue = !enabled
    setEnabled(newValue)
    startTransition(async () => {
      try {
        await setMaintenanceMode(newValue)
      } catch {
        setEnabled(!newValue) // rollback on error
      }
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-medium text-zinc-900 dark:text-white">Mode Maintenance</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ketika aktif, user non-admin yang login akan diarahkan ke halaman maintenance.
          </p>
          {enabled && (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-pulse" />
              Maintenance sedang aktif
            </p>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          aria-label="Toggle maintenance mode"
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled
              ? 'bg-amber-500 focus:ring-amber-500'
              : 'bg-zinc-200 dark:bg-zinc-700 focus:ring-zinc-500'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
