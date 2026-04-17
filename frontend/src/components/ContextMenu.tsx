import { useEffect, useRef, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

export type ContextMenuState = {
  x: number
  y: number
  projectId: number
  projectName: string
} | null

type Props = {
  state: ContextMenuState
  onClose: () => void
  onGitPull: (projectId: number) => void
  onGitPush: (projectId: number) => void
}

export function ContextMenu({ state, onClose, onGitPull, onGitPush }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [state, onClose])

  if (!state) return null

  const style: CSSProperties = {
    position: 'fixed',
    left: Math.min(state.x, window.innerWidth - 200),
    top: Math.min(state.y, window.innerHeight - 120),
    zIndex: 50,
  }

  const menu = (
    <div
      ref={ref}
      role="menu"
      style={style}
      className="min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
    >
      <div className="border-b border-zinc-100 px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        {state.projectName}
      </div>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => {
          onGitPull(state.projectId)
          onClose()
        }}
      >
        <ArrowDownToLine className="h-4 w-4 shrink-0" aria-hidden />
        Git pull
      </button>
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => {
          onGitPush(state.projectId)
          onClose()
        }}
      >
        <ArrowUpFromLine className="h-4 w-4 shrink-0" aria-hidden />
        Git push
      </button>
    </div>
  )

  return createPortal(menu, document.body)
}
