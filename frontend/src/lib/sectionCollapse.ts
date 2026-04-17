const KEY = 'pm-board-sections-collapsed'

export type SectionCollapseState = {
  starred: boolean
  projects: boolean
  archived: boolean
}

const defaultState: SectionCollapseState = {
  starred: false,
  projects: false,
  archived: false,
}

export function loadSectionCollapse(): SectionCollapseState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return { ...defaultState }
    const j = JSON.parse(raw) as Record<string, unknown>
    return {
      starred: Boolean(j.starred),
      projects: Boolean(j.projects),
      archived: Boolean(j.archived),
    }
  } catch {
    return { ...defaultState }
  }
}

export function saveSectionCollapse(s: SectionCollapseState) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}
