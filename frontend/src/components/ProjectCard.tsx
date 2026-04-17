import { AnimatePresence, motion } from 'framer-motion'
import { Archive, Clock, Copy, ExternalLink, GitBranch, Pin } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ProjectOut } from '../api/types'
import { formatShortRelative } from '../lib/relativeTime'
import {
  detectTechStack,
  getProjectChipStyles,
  inferProjectChip,
  isRecentlyActive,
  projectInitials,
} from '../lib/projectMeta'
import { ActivitySparkline } from './ActivitySparkline'
import { TechStackIcons } from './TechStackIcons'

type Props = {
  project: ProjectOut
  expanded: boolean
  viewMode: 'grid' | 'list'
  isPinned: boolean
  onToggleExpand: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onSaveDescription: (description: string) => Promise<void>
  onPin: () => void
  onArchive: () => void
  onCopyPath: () => void
  isArchived: boolean
  /** Optional drag handle (e.g. from @dnd-kit useSortable listeners on a grip button). */
  dragHandle?: React.ReactNode
  /** Ports matched to this project name from the shared listening-ports feed. */
  listeningPortNumbers?: number[]
}

export function ProjectCard({
  project,
  expanded,
  viewMode,
  isPinned,
  onToggleExpand,
  onContextMenu,
  onSaveDescription,
  onPin,
  onArchive,
  onCopyPath,
  isArchived,
  dragHandle,
  listeningPortNumbers = [],
}: Props) {
  const [draft, setDraft] = useState(project.description)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDraft(project.description), 0)
    return () => window.clearTimeout(t)
  }, [project.description])

  const chip = inferProjectChip(project)
  const styles = getProjectChipStyles(chip)
  const techIds = detectTechStack(project).map((t) => t.id)
  const updatedShort = formatShortRelative(project.last_updated)
  const recent = isRecentlyActive(project.last_updated, 72)
  const initials = projectInitials(project.name)
  const showPorts = listeningPortNumbers.length > 0
  const repoUrl = project.repo_url
  const RepoLinkIcon =
    repoUrl && /github\.com/i.test(repoUrl) ? GitBranch : ExternalLink

  const body = (
    <>
      <div
        className={`flex min-w-0 flex-1 gap-2 ${viewMode === 'list' ? 'flex-col sm:flex-row sm:items-center' : 'flex-col'}`}
      >
        <div className="flex min-w-0 flex-1 gap-2.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tracking-tight shadow-inner ring-2 ${styles.avatar} ${styles.ring}`}
            aria-hidden
          >
            {initials}
          </div>
          <div
            className={`min-w-0 flex-1 ${viewMode === 'grid' ? 'pr-24' : ''}`}
          >
            <h3
              className="truncate text-base font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50"
              title={project.name}
            >
              {project.name}
            </h3>
            <div className="mt-0.5 flex min-w-0 flex-nowrap items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span
                className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${styles.tag}`}
              >
                {styles.label}
              </span>
              {showPorts
                ? listeningPortNumbers.map((port) => (
                    <span
                      key={port}
                      className="inline-flex shrink-0 items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-zinc-700 ring-1 ring-zinc-950/[0.04] dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-200"
                      title={`Listening on ${port}`}
                    >
                      :{port}
                    </span>
                  ))
                : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                <Clock className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                <time dateTime={project.last_updated ?? undefined}>{updatedShort}</time>
              </span>
              <TechStackIcons ids={techIds} />
            </div>
          </div>
        </div>

        <div
          className={`flex items-end justify-between gap-2 ${viewMode === 'list' ? 'sm:justify-end' : ''}`}
        >
          <ActivitySparkline
            seedKey={`${project.id}-${project.last_updated ?? ''}`}
            active={recent}
          />
        </div>
      </div>
    </>
  )

  return (
    <motion.article
      layout
      className={`group relative flex w-full flex-col rounded-[14px] border border-zinc-200/80 bg-white/90 p-3 shadow-sm ring-1 ring-zinc-950/[0.04] transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg dark:border-zinc-800/90 dark:bg-zinc-900/60 dark:ring-white/[0.06] dark:hover:border-zinc-600 dark:hover:shadow-xl dark:hover:shadow-black/40 `}
      onContextMenu={onContextMenu}
    >
      {repoUrl ? (
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto absolute bottom-3 right-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          title="Open repository"
          aria-label="Open git repository in browser"
          onClick={(e) => e.stopPropagation()}
        >
          <RepoLinkIcon className="h-4 w-4" strokeWidth={2} />
        </a>
      ) : null}

      <div
        className={`pointer-events-none absolute bottom-3 left-0 top-3 w-[3px] rounded-full ${styles.stripe}`}
        aria-hidden
      />

      <div
        className={`flex gap-2 pl-3 ${viewMode === 'list' ? 'flex-row items-start' : 'flex-col'}`}
      >
        {dragHandle ? <div className="shrink-0">{dragHandle}</div> : null}
        <div
          className={`min-w-0 flex-1 cursor-pointer ${repoUrl ? 'pb-7' : ''}`}
          data-card-main
          onClick={onToggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onToggleExpand()
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          {body}
        </div>

        <div
          className={`pointer-events-auto flex shrink-0 items-center gap-0.5 ${
            viewMode === 'grid'
              ? 'absolute right-3 top-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100'
              : 'opacity-0 transition-opacity group-hover:opacity-100'
          } `}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title="Copy path"
            aria-label="Copy project path"
            onClick={onCopyPath}
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title={isPinned ? 'Unpin' : 'Pin to top'}
            aria-label={isPinned ? 'Unpin project' : 'Pin project'}
            onClick={onPin}
          >
            <Pin
              className={`h-4 w-4 ${isPinned ? 'text-amber-500' : 'text-zinc-500'}`}
              fill={isPinned ? 'currentColor' : 'none'}
            />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            title={isArchived ? 'Restore to board' : 'Archive'}
            aria-label={isArchived ? 'Restore project' : 'Archive project'}
            onClick={onArchive}
          >
            <Archive className="h-4 w-4" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden pl-3"
          >
            <div
              className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50/90 p-3 text-left dark:border-zinc-700 dark:bg-zinc-950/60"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Description
              </p>
              <textarea
                className="mb-2 min-h-[5rem] w-full resize-y rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Notes about this project…"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={saving || draft === project.description}
                  className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={async () => {
                    setSaving(true)
                    try {
                      await onSaveDescription(draft)
                    } finally {
                      setSaving(false)
                    }
                  }}
                >
                  {saving ? 'Saving…' : 'Save description'}
                </button>
              </div>
              <p className="mt-2 truncate text-[10px] text-zinc-400" title={project.path}>
                {project.path}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}
