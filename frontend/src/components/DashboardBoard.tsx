import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCorners,
  type DragEndEvent,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react'
import type { BoardSection, ListeningPortOut, ProjectOut } from '../api/types'
import { saveDashboardLayout } from '../api/client'
import {
  applyLayoutItemsToProjects,
  BOARD_CONTAINERS,
  findContainerForId,
  layoutBodyFromItems,
  splitIdsFromProjects,
} from '../lib/boardLayout'
import type { SectionCollapseState } from '../lib/sectionCollapse'
import { ProjectCard } from './ProjectCard'

type Props = {
  projects: ProjectOut[]
  setProjects: React.Dispatch<React.SetStateAction<ProjectOut[]>>
  viewMode: 'grid' | 'list'
  expanded: Set<number>
  onToggleExpand: (id: number) => void
  onContextMenu: (e: React.MouseEvent, p: ProjectOut) => void
  onSaveDescription: (id: number, description: string) => Promise<void>
  onCopyPath: (path: string) => void
  onPin: (id: number) => void
  onArchive: (id: number) => void
  dragDisabled: boolean
  collapse: SectionCollapseState
  onCollapseChange: (s: SectionCollapseState) => void
  onToast: (msg: string) => void
  visibleFilter: (p: ProjectOut) => boolean
  listeningPorts: ListeningPortOut[]
}

const SECTION_LABEL: Record<BoardSection, string> = {
  starred: 'Starred',
  projects: 'Projects',
  archived: 'Archived',
}

function applyDragEnd(
  items: Record<BoardSection, string[]>,
  activeId: string,
  overId: string,
): Record<BoardSection, string[]> | null {
  if (activeId === overId) return null

  const activeContainer = findContainerForId(activeId, items)
  if (!activeContainer) return null

  const overIsCol = BOARD_CONTAINERS.includes(overId as BoardSection)
  const overContainer = overIsCol
    ? (overId as BoardSection)
    : findContainerForId(overId, items)
  if (!overContainer) return null

  const next: Record<BoardSection, string[]> = {
    starred: [...items.starred],
    projects: [...items.projects],
    archived: [...items.archived],
  }

  if (activeContainer === overContainer) {
    if (overIsCol) {
      const oldIndex = next[activeContainer].indexOf(activeId)
      if (oldIndex === -1) return null
      const arr = [...next[activeContainer]]
      arr.splice(oldIndex, 1)
      arr.push(activeId)
      next[activeContainer] = arr
      return next
    }
    const oldIndex = next[activeContainer].indexOf(activeId)
    const newIndex = next[overContainer].indexOf(overId)
    if (oldIndex === -1 || newIndex === -1) return null
    next[activeContainer] = arrayMove(next[activeContainer], oldIndex, newIndex)
    return next
  }

  const from = next[activeContainer]
  const idx = from.indexOf(activeId)
  if (idx === -1) return null
  from.splice(idx, 1)

  let insertIndex: number
  if (overIsCol) {
    insertIndex = next[overContainer].length
  } else {
    insertIndex = next[overContainer].indexOf(overId)
    if (insertIndex === -1) insertIndex = next[overContainer].length
  }
  next[overContainer].splice(insertIndex, 0, activeId)
  return next
}

function SortableProjectCard({
  project,
  viewMode,
  expanded,
  onToggleExpand,
  onContextMenu,
  onSaveDescription,
  onCopyPath,
  onPin,
  onArchive,
  dragDisabled,
  listeningPortNumbers,
}: {
  project: ProjectOut
  viewMode: 'grid' | 'list'
  expanded: boolean
  onToggleExpand: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onSaveDescription: (description: string) => Promise<void>
  onCopyPath: () => void
  onPin: () => void
  onArchive: () => void
  dragDisabled: boolean
  listeningPortNumbers: number[]
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(project.id),
    disabled: dragDisabled,
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handle = (
    <button
      type="button"
      className="mt-0.5 inline-flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 active:cursor-grabbing dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      aria-label="Drag to reorder or move section"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="h-4 w-4" strokeWidth={2} />
    </button>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'relative z-10 opacity-60' : ''}
    >
      <ProjectCard
        project={project}
        expanded={expanded}
        viewMode={viewMode}
        isPinned={project.board_section === 'starred'}
        onToggleExpand={onToggleExpand}
        onContextMenu={onContextMenu}
        onSaveDescription={onSaveDescription}
        onPin={onPin}
        onArchive={onArchive}
        onCopyPath={onCopyPath}
        isArchived={project.board_section === 'archived'}
        dragHandle={dragDisabled ? undefined : handle}
        listeningPortNumbers={listeningPortNumbers}
      />
    </div>
  )
}

function SectionDropZone({
  sectionId,
  children,
  className,
}: {
  sectionId: BoardSection
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef } = useDroppable({ id: sectionId })
  return (
    <div ref={setNodeRef} className={className}>
      {children}
    </div>
  )
}

export function DashboardBoard({
  projects,
  setProjects,
  viewMode,
  expanded,
  onToggleExpand,
  onContextMenu,
  onSaveDescription,
  onCopyPath,
  onPin,
  onArchive,
  dragDisabled,
  collapse,
  onCollapseChange,
  onToast,
  visibleFilter,
  listeningPorts,
}: Props) {
  const [items, setItems] = useState(() => splitIdsFromProjects(projects))

  useEffect(() => {
    const t = window.setTimeout(() => setItems(splitIdsFromProjects(projects)), 0)
    return () => window.clearTimeout(t)
  }, [projects])

  const projectById = useMemo(() => {
    const m = new Map<number, ProjectOut>()
    for (const p of projects) m.set(p.id, p)
    return m
  }, [projects])

  const portsByProjectName = useMemo(() => {
    const m = new Map<string, number[]>()
    for (const r of listeningPorts) {
      const arr = m.get(r.name) ?? []
      arr.push(r.port)
      m.set(r.name, arr)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a - b)
    }
    return m
  }, [listeningPorts])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const persistLayout = useCallback(
    async (
      next: Record<BoardSection, string[]>,
      rollback: {
        items: Record<BoardSection, string[]>
        projects: ProjectOut[]
      },
    ) => {
      try {
        const out = await saveDashboardLayout(layoutBodyFromItems(next))
        setProjects(out)
      } catch (e) {
        onToast(e instanceof Error ? e.message : 'Could not save layout')
        setItems(rollback.items)
        setProjects(rollback.projects)
      }
    },
    [setProjects, onToast],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (dragDisabled) return
      const { active, over } = event
      if (!over) return
      const activeId = String(active.id)
      const overId = String(over.id)
      const next = applyDragEnd(items, activeId, overId)
      if (!next) return
      const rollback = {
        items: {
          starred: [...items.starred],
          projects: [...items.projects],
          archived: [...items.archived],
        },
        projects: projects.map((p) => ({ ...p })),
      }
      setItems(next)
      setProjects((prev) => applyLayoutItemsToProjects(prev, next))
      void persistLayout(next, rollback)
    },
    [items, projects, persistLayout, dragDisabled, setProjects],
  )

  const gridClass =
    viewMode === 'grid'
      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'flex flex-col gap-3'

  const toggleSection = (key: keyof SectionCollapseState) => {
    onCollapseChange({ ...collapse, [key]: !collapse[key] })
  }

  const renderSection = (section: BoardSection) => {
    const collapsed = collapse[section]
    const ids = items[section]
    const label = SECTION_LABEL[section]

    return (
      <section
        key={section}
        className="rounded-2xl border border-zinc-200/90 bg-white/60 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-900/40"
      >
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          onClick={() => toggleSection(section)}
          aria-expanded={!collapsed}
        >
          <div className="flex min-w-0 items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-500" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
            )}
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {label}
            </span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {ids.length}
            </span>
          </div>
        </button>

        {!collapsed ? (
          <div className="border-t border-zinc-100 px-3 pb-4 pt-2 dark:border-zinc-800">
            <SectionDropZone sectionId={section} className="min-h-[4rem]">
              <SortableContext id={section} items={ids} strategy={rectSortingStrategy}>
                <div className={gridClass}>
                  {ids.map((idStr) => {
                    const p = projectById.get(Number(idStr))
                    if (!p) return null
                    if (!visibleFilter(p)) return null
                    return (
                      <SortableProjectCard
                        key={p.id}
                        project={p}
                        viewMode={viewMode}
                        expanded={expanded.has(p.id)}
                        onToggleExpand={() => onToggleExpand(p.id)}
                        onContextMenu={(e) => onContextMenu(e, p)}
                        onSaveDescription={(d) => onSaveDescription(p.id, d)}
                        onCopyPath={() => onCopyPath(p.path)}
                        onPin={() => onPin(p.id)}
                        onArchive={() => onArchive(p.id)}
                        dragDisabled={dragDisabled}
                        listeningPortNumbers={portsByProjectName.get(p.name) ?? []}
                      />
                    )
                  })}
                </div>
              </SortableContext>
            </SectionDropZone>
            {ids.length === 0 ? (
              <p className="px-1 pb-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Drag projects here
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {renderSection('starred')}
        {renderSection('projects')}
        {renderSection('archived')}
      </div>
    </DndContext>
  )
}
