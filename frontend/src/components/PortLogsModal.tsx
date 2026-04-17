import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getPortLogs } from '../api/client'

type Props = {
  port: number | null
  subtitle: string
  onClose: () => void
}

export function PortLogsModal({ port, subtitle, onClose }: Props) {
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (port == null) return
    let cancelled = false
    const t = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      setText('')
      setSource('')
      ;(async () => {
        try {
          const res = await getPortLogs(port)
          if (!cancelled) {
            setText(res.text)
            setSource(res.source)
          }
        } catch (e) {
          if (!cancelled)
            setError(e instanceof Error ? e.message : 'Failed to load logs')
        } finally {
          if (!cancelled) setLoading(false)
        }
      })()
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [port])

  if (port == null) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="port-logs-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex max-h-[min(28rem,85vh)] w-full max-w-lg flex-col rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div>
            <h2 id="port-logs-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Logs — port {port}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            {source ? (
              <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-400">
                Source: {source}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <p className="text-xs text-zinc-500">Loading…</p>
          ) : null}
          {error ? (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          {!loading && !error ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200">
              {text}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  )
}
