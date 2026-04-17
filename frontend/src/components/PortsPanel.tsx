import { useCallback, useEffect, useMemo, useState } from 'react'
import { Info, RefreshCw, X } from 'lucide-react'
import { killPort } from '../api/client'
import type { ListeningPortOut, ProjectOut } from '../api/types'
import {
  getProjectChipStyles,
  inferProjectChip,
} from '../lib/projectMeta'
import { PortLogsModal } from './PortLogsModal'

const PORTS_DATA_SOURCE =
  'Server runs:\n• ss -tulpn — TCP/UDP listeners and process (name/PID)\nThen per PID:\n• realpath /proc/<pid>/cwd — match cwd to a board project\n• read /proc/<pid>/cmdline — infer stack (Vite, uvicorn, etc.)\n\nStop: SIGTERM via os.kill (same UID only).\nLogs: journalctl _PID=<pid> -n 15 when journald has entries.'

function groupByProjectName(rows: ListeningPortOut[]) {
  const m = new Map<string, ListeningPortOut[]>()
  for (const r of rows) {
    const k = r.name
    const arr = m.get(k) ?? []
    arr.push(r)
    m.set(k, arr)
  }
  for (const arr of m.values()) {
    arr.sort((a, b) => a.port - b.port)
  }
  return Array.from(m.entries())
    .map(([name, items]) => ({ name, items, key: name }))
    .sort((a, b) => a.items[0].port - b.items[0].port)
}

export type PortsPanelProps = {
  rows: ListeningPortOut[]
  projects: ProjectOut[]
  error: string | null
  initial: boolean
  syncing: boolean
  onRefresh: () => Promise<void>
}

export function PortsPanel({
  rows,
  projects,
  error,
  initial,
  syncing,
  onRefresh,
}: PortsPanelProps) {
  const [toast, setToast] = useState<string | null>(null)
  const [logPort, setLogPort] = useState<number | null>(null)
  const [logSubtitle, setLogSubtitle] = useState('')

  const groups = useMemo(() => groupByProjectName(rows), [rows])

  const projectByName = useMemo(() => {
    const m = new Map<string, ProjectOut>()
    for (const p of projects) {
      m.set(p.name, p)
    }
    return m
  }, [projects])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(t)
  }, [toast])

  const handleKill = async (e: React.MouseEvent, port: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (
      !window.confirm(
        `Send SIGTERM to the process listening on port ${port}?`,
      )
    ) {
      return
    }
    try {
      const res = await killPort(port)
      setToast(res.ok ? res.message : res.message)
      await onRefresh()
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not stop process')
    }
  }

  const handleStopAll = useCallback(async () => {
    if (rows.length === 0) return
    if (
      !window.confirm(
        `Send SIGTERM to every process listening on the ${rows.length} listed ports?`,
      )
    ) {
      return
    }
    let lastMsg = ''
    for (const r of rows) {
      try {
        const res = await killPort(r.port)
        if (!res.ok) lastMsg = res.message
      } catch (err) {
        lastMsg = err instanceof Error ? err.message : 'Stop failed'
      }
    }
    if (lastMsg) setToast(lastMsg)
    else setToast('Stop signals sent for all ports.')
    await onRefresh()
  }, [rows, onRefresh])

  const openLogs = (r: ListeningPortOut) => {
    setLogSubtitle(`${r.name} · ${r.tech}`)
    setLogPort(r.port)
  }

  const headerClassForGroup = (name: string) => {
    const p = projectByName.get(name)
    if (!p) return 'text-zinc-500 dark:text-zinc-400'
    return getProjectChipStyles(inferProjectChip(p)).header
  }

  return (
    <>
      <aside
        className="flex max-h-[min(50vh,22rem)] w-full shrink-0 flex-col border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-0 lg:max-h-none lg:h-svh lg:w-[min(100vw,20rem)] lg:min-w-[18rem] lg:border-l lg:border-t-0"
        aria-label="Listening ports"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Ports
            </h2>
            <div className="flex items-center gap-0.5">
              <div className="group/info relative">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <Info className="h-3.5 w-3.5" strokeWidth={2} />
                  <span className="sr-only">{PORTS_DATA_SOURCE}</span>
                </button>
                <div
                  role="tooltip"
                  aria-hidden="true"
                  className="pointer-events-none invisible absolute right-0 top-full z-[60] mt-1.5 w-[min(calc(100vw-2rem),16rem)] rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-left text-[10px] leading-snug text-zinc-700 opacity-0 shadow-lg transition-opacity group-hover/info:visible group-hover/info:opacity-100 group-focus-within/info:visible group-focus-within/info:opacity-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  <p className="whitespace-pre-line font-sans">{PORTS_DATA_SOURCE}</p>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label="Refresh ports"
                onClick={() => void onRefresh()}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {toast ? (
            <p
              className="shrink-0 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
              role="status"
            >
              {toast}
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {error ? (
              <p className="text-xs leading-snug text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            {initial && !error ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
            ) : null}

            {!error && rows.length === 0 && !initial ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">No listeners found.</p>
            ) : null}

            <ul className="flex flex-col gap-4 text-xs">
              {groups.map((g) => (
                <li key={g.key}>
                  <div
                    className={`mb-2 border-l-2 border-zinc-200 pl-2 text-[11px] font-semibold tracking-wide dark:border-zinc-600 ${headerClassForGroup(g.name)}`}
                  >
                    {g.name}
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {g.items.map((r) => {
                      const matched = projectByName.has(r.name)
                      return (
                        <li key={r.port}>
                          <div
                            role="button"
                            tabIndex={0}
                            className="group relative flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-100 bg-zinc-50/80 px-2.5 py-2 pr-2 outline-none transition hover:border-zinc-200 hover:bg-zinc-100/80 focus-visible:ring-2 focus-visible:ring-violet-400 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50"
                            onClick={() => openLogs(r)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openLogs(r)
                              }
                            }}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                matched
                                  ? 'bg-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.35)]'
                                  : 'bg-red-500 shadow-[0_0_0_1px_rgba(239,68,68,0.35)]'
                              }`}
                              aria-hidden
                              title={matched ? 'Matched to a project' : 'Not matched to board'}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                                {r.port}
                              </div>
                              <div
                                className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400"
                                title={r.tech}
                              >
                                {r.tech}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mt-0.5 shrink-0 rounded-md p-1.5 text-red-600 opacity-0 transition-opacity hover:bg-red-50 group-hover:opacity-100 dark:text-red-400 dark:hover:bg-red-950/50"
                              aria-label={`Stop process on port ${r.port}`}
                              onClick={(e) => void handleKill(e, r.port)}
                            >
                              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </div>

          {rows.length > 0 ? (
            <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
              <button
                type="button"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                onClick={() => void handleStopAll()}
              >
                Stop all ({rows.length})
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <PortLogsModal
        port={logPort}
        subtitle={logSubtitle}
        onClose={() => {
          setLogPort(null)
          setLogSubtitle('')
        }}
      />
    </>
  )
}
