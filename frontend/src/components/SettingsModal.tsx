import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
  projectsRoot: string
  importPath: string
  onSaveRoot: (root: string) => Promise<void>
  onImport: (path: string) => Promise<void>
}

export function SettingsModal({
  open,
  onClose,
  projectsRoot,
  importPath: initialImport,
  onSaveRoot,
  onImport,
}: Props) {
  const [root, setRoot] = useState(projectsRoot)
  const [imp, setImp] = useState(initialImport)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      setRoot(projectsRoot)
      setImp(initialImport)
      setError(null)
    }, 0)
    return () => window.clearTimeout(t)
  }, [open, projectsRoot, initialImport])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Settings
          </h2>
          <button
            type="button"
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Projects root
        </label>
        <p className="mb-2 text-xs text-zinc-500">
          Immediate subdirectories of this path appear as project cards after scan.
        </p>
        <input
          className="mb-4 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          value={root}
          onChange={(e) => setRoot(e.target.value)}
          autoComplete="off"
        />

        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                await onSaveRoot(root)
                onClose()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Save failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            Save &amp; scan
          </button>
        </div>

        <hr className="my-6 border-zinc-200 dark:border-zinc-700" />

        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Import project
        </label>
        <p className="mb-2 text-xs text-zinc-500">Absolute path to a project directory.</p>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
            value={imp}
            onChange={(e) => setImp(e.target.value)}
            placeholder="/path/to/repo"
            autoComplete="off"
          />
          <button
            type="button"
            disabled={busy || !imp.trim()}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
            onClick={async () => {
              setBusy(true)
              setError(null)
              try {
                await onImport(imp.trim())
                onClose()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Import failed')
              } finally {
                setBusy(false)
              }
            }}
          >
            Import
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}
