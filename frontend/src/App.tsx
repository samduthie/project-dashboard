import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LayoutGrid, List, Search, Settings } from 'lucide-react'
import {
  getSettings,
  gitPull,
  gitPush,
  importProject,
  listListeningPorts,
  listProjects,
  patchSettings,
  saveDashboardLayout,
  scanProjects,
  updateProject,
} from './api/client'
import type { BoardSection, ListeningPortOut, ProjectOut } from './api/types'
import { ContextMenu, type ContextMenuState } from './components/ContextMenu'
import { DashboardBoard } from './components/DashboardBoard'
import { PortsPanel } from './components/PortsPanel'
import { SettingsModal } from './components/SettingsModal'
import {
  clearLegacyPinArchiveKeys,
  hasLegacyPinArchivePrefs,
  loadArchivedIds,
  loadPinnedIds,
  markLayoutMigratedFromLegacy,
} from './lib/dashboardPrefs'
import { legacyLayoutFromProjects, moveProjectToSection } from './lib/boardLayout'
import { isRecentlyActive } from './lib/projectMeta'
import {
  loadSectionCollapse,
  saveSectionCollapse,
  type SectionCollapseState,
} from './lib/sectionCollapse'

type FilterChip = 'all' | 'recent'

export default function App() {
  const [projects, setProjects] = useState<ProjectOut[]>([])
  const [projectsRoot, setProjectsRoot] = useState('/home/sam/projects/')
  const [importPath, setImportPath] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [menu, setMenu] = useState<ContextMenuState>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterChip>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [collapse, setCollapse] = useState<SectionCollapseState>(() =>
    loadSectionCollapse(),
  )

  const migrationAttempted = useRef(false)

  const [listeningPorts, setListeningPorts] = useState<ListeningPortOut[]>([])
  const [portsError, setPortsError] = useState<string | null>(null)
  const [portsInitial, setPortsInitial] = useState(true)
  const [portsSyncing, setPortsSyncing] = useState(false)

  const refreshListeningPorts = useCallback(async () => {
    setPortsSyncing(true)
    try {
      setPortsError(null)
      const data = await listListeningPorts()
      setListeningPorts(data)
    } catch (e) {
      setPortsError(e instanceof Error ? e.message : 'Failed to load ports')
    } finally {
      setPortsSyncing(false)
      setPortsInitial(false)
    }
  }, [])

  useEffect(() => {
    const first = window.setTimeout(() => void refreshListeningPorts(), 0)
    const id = window.setInterval(() => void refreshListeningPorts(), 10_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(id)
    }
  }, [refreshListeningPorts])

  const refresh = useCallback(async () => {
    const list = await listProjects()
    setProjects(list)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const s = await getSettings()
        if (!cancelled) setProjectsRoot(s.projects_root)
        const list = await listProjects()
        if (!cancelled) setProjects(list)
      } catch (e) {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : 'Failed to load')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveSectionCollapse(collapse)
  }, [collapse])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 5000)
  }, [])

  /** One-time: push legacy localStorage pin/archive into server layout. */
  useEffect(() => {
    if (migrationAttempted.current || projects.length === 0) return
    if (!hasLegacyPinArchivePrefs()) {
      migrationAttempted.current = true
      return
    }
    migrationAttempted.current = true
    let cancelled = false
    ;(async () => {
      try {
        const body = legacyLayoutFromProjects(
          projects,
          loadPinnedIds(),
          loadArchivedIds(),
        )
        const out = await saveDashboardLayout(body)
        if (cancelled) return
        setProjects(out)
        markLayoutMigratedFromLegacy()
        clearLegacyPinArchiveKeys()
        showToast('Imported pinned and archived layout from this browser')
      } catch {
        migrationAttempted.current = false
        showToast('Could not migrate saved pins — you can still organize by dragging')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projects, showToast])

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleGit = async (projectId: number, op: 'pull' | 'push') => {
    try {
      const res = op === 'pull' ? await gitPull(projectId) : await gitPush(projectId)
      if (res.exit_code === 0) {
        showToast(op === 'pull' ? 'Git pull finished' : 'Git push finished')
      } else {
        showToast(
          `${op} exited ${res.exit_code}: ${res.stderr || res.stdout || 'error'}`,
        )
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Git command failed')
    }
  }

  const projectMatchesFilter = useCallback(
    (p: ProjectOut) => {
      const q = search.trim().toLowerCase()
      if (q) {
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.path.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (filter === 'recent') {
        return isRecentlyActive(p.last_updated, 24 * 7)
      }
      return true
    },
    [search, filter],
  )

  const hasAnyVisibleProject = useMemo(
    () => projects.some((p) => projectMatchesFilter(p)),
    [projects, projectMatchesFilter],
  )

  const dragDisabled =
    search.trim().length > 0 || filter === 'recent'

  const handlePin = async (id: number) => {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    const section: BoardSection =
      p.board_section === 'starred' ? 'projects' : 'starred'
    try {
      const out = await saveDashboardLayout(
        moveProjectToSection(projects, id, section),
      )
      setProjects(out)
      showToast(section === 'starred' ? 'Starred' : 'Moved to Projects')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update')
    }
  }

  const handleArchive = async (id: number) => {
    const p = projects.find((x) => x.id === id)
    if (!p) return
    const section: BoardSection =
      p.board_section === 'archived' ? 'projects' : 'archived'
    setExpanded((prev) => {
      const n = new Set(prev)
      n.delete(id)
      return n
    })
    try {
      const out = await saveDashboardLayout(
        moveProjectToSection(projects, id, section),
      )
      setProjects(out)
      showToast(section === 'archived' ? 'Archived' : 'Restored to Projects')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not update')
    }
  }

  const copyPath = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path)
      showToast('Path copied')
    } catch {
      showToast('Could not copy path')
    }
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
    }`

  return (
    <div className="flex min-h-svh flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-4 px-4 py-4 sm:px-8">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="Settings"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="min-w-0 text-right">
            <h1 className="text-xl font-semibold tracking-tight">Projects</h1>
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {projectsRoot}
            </p>
          </div>
        </header>

        <div className="sticky top-0 z-20 border-b border-zinc-200/80 bg-zinc-50/90 px-4 py-3 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                aria-label="Search projects"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter projects">
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'all'}
                  className={chipClass(filter === 'all')}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === 'recent'}
                  className={chipClass(filter === 'recent')}
                  onClick={() => setFilter('recent')}
                >
                  Recent
                </button>
              </div>
              <div
                className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  className={`rounded-md p-2 ${viewMode === 'grid' ? 'bg-white shadow-sm dark:bg-zinc-800' : 'text-zinc-500'}`}
                  aria-pressed={viewMode === 'grid'}
                  title="Grid"
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={`rounded-md p-2 ${viewMode === 'list' ? 'bg-white shadow-sm dark:bg-zinc-800' : 'text-zinc-500'}`}
                  aria-pressed={viewMode === 'list'}
                  title="List"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 px-4 pb-16 pt-6 sm:px-8">
          {loadError ? (
            <p className="text-center text-red-600 dark:text-red-400" role="alert">
              {loadError} — is the API running on port 8000?
            </p>
          ) : null}

          {projects.length === 0 && !loadError ? (
            <p className="text-center text-zinc-600 dark:text-zinc-400">
              No projects yet. Open{' '}
              <button
                type="button"
                className="font-medium text-violet-600 underline dark:text-violet-400"
                onClick={() => setSettingsOpen(true)}
              >
                settings
              </button>{' '}
              to set the projects root and scan, or import a path.
            </p>
          ) : null}

          {!hasAnyVisibleProject && projects.length > 0 && !loadError ? (
            <p className="mb-6 text-center text-zinc-600 dark:text-zinc-400">
              No projects match your search or filter.
            </p>
          ) : null}

          {projects.length > 0 && !loadError ? (
            <DashboardBoard
              projects={projects}
              setProjects={setProjects}
              viewMode={viewMode}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              onContextMenu={(e, p) => {
                e.preventDefault()
                setMenu({
                  x: e.clientX,
                  y: e.clientY,
                  projectId: p.id,
                  projectName: p.name,
                })
              }}
              onSaveDescription={async (projectId, description) => {
                const updated = await updateProject(projectId, { description })
                setProjects((prev) =>
                  prev.map((x) => (x.id === updated.id ? updated : x)),
                )
                showToast('Description saved')
              }}
              onCopyPath={copyPath}
              onPin={handlePin}
              onArchive={handleArchive}
              dragDisabled={dragDisabled}
              collapse={collapse}
              onCollapseChange={setCollapse}
              onToast={showToast}
              visibleFilter={projectMatchesFilter}
              listeningPorts={listeningPorts}
            />
          ) : null}
        </main>
      </div>

      <PortsPanel
        rows={listeningPorts}
        projects={projects}
        error={portsError}
        initial={portsInitial}
        syncing={portsSyncing}
        onRefresh={refreshListeningPorts}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projectsRoot={projectsRoot}
        importPath={importPath}
        onSaveRoot={async (root) => {
          await patchSettings(root)
          setProjectsRoot(root)
          await scanProjects()
          await refresh()
          showToast('Settings saved and projects scanned')
        }}
        onImport={async (path) => {
          await importProject(path)
          setImportPath('')
          await refresh()
          showToast('Project imported')
        }}
      />

      <ContextMenu
        state={menu}
        onClose={() => setMenu(null)}
        onGitPull={(id) => handleGit(id, 'pull')}
        onGitPush={(id) => handleGit(id, 'push')}
      />

      {toast ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-lg dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
