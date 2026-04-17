import type { BoardSection, ProjectOut } from '../api/types'

export const BOARD_CONTAINERS: BoardSection[] = ['starred', 'projects', 'archived']

export function splitIdsFromProjects(
  projects: ProjectOut[],
): Record<BoardSection, string[]> {
  const by = (s: BoardSection) =>
    projects
      .filter((p) => p.board_section === s)
      .sort(
        (a, b) =>
          a.board_order - b.board_order || a.name.localeCompare(b.name),
      )
      .map((p) => String(p.id))
  return {
    starred: by('starred'),
    projects: by('projects'),
    archived: by('archived'),
  }
}

export function layoutBodyFromItems(items: Record<BoardSection, string[]>) {
  return {
    starred: items.starred.map(Number),
    projects: items.projects.map(Number),
    archived: items.archived.map(Number),
  }
}

/** Apply drag result to project rows so UI matches `items` before the server responds. */
export function applyLayoutItemsToProjects(
  projectList: ProjectOut[],
  items: Record<BoardSection, string[]>,
): ProjectOut[] {
  const placement = new Map<number, { section: BoardSection; order: number }>()
  for (const section of BOARD_CONTAINERS) {
    items[section].forEach((idStr, idx) => {
      placement.set(Number(idStr), { section, order: idx })
    })
  }
  return projectList.map((p) => {
    const pos = placement.get(p.id)
    if (!pos) return p
    return { ...p, board_section: pos.section, board_order: pos.order }
  })
}

export function findContainerForId(
  id: string,
  items: Record<BoardSection, string[]>,
): BoardSection | undefined {
  if (BOARD_CONTAINERS.includes(id as BoardSection)) return id as BoardSection
  return BOARD_CONTAINERS.find((c) => items[c].includes(id))
}

/** Build layout body from legacy localStorage pin/archive prefs (one-time migration). */
export function legacyLayoutFromProjects(
  projects: ProjectOut[],
  pinned: number[],
  archived: number[],
): { starred: number[]; projects: number[]; archived: number[] } {
  const pinSet = new Set(pinned)
  const archSet = new Set(archived)
  const order = projects.map((p) => p.id)
  const archivedIds = order.filter((id) => archSet.has(id))
  const starredIds = order.filter((id) => pinSet.has(id) && !archSet.has(id))
  const taken = new Set([...archivedIds, ...starredIds])
  const mainIds = order.filter((id) => !taken.has(id))
  return { starred: starredIds, projects: mainIds, archived: archivedIds }
}

/** Move one project to the end of a section; returns POST body for dashboard-layout. */
export function moveProjectToSection(
  projects: ProjectOut[],
  projectId: number,
  section: BoardSection,
): { starred: number[]; projects: number[]; archived: number[] } {
  const items = splitIdsFromProjects(projects)
  const idStr = String(projectId)
  for (const c of BOARD_CONTAINERS) {
    items[c] = items[c].filter((x) => x !== idStr)
  }
  items[section].push(idStr)
  return layoutBodyFromItems(items)
}
