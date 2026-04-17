const PIN_KEY = 'pm-dashboard-pinned'
const ARCHIVE_KEY = 'pm-dashboard-archived'
const LAYOUT_MIGRATED_KEY = 'pm-dashboard-layout-migrated-v1'

function readIds(key: string): number[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is number => typeof x === 'number')
  } catch {
    return []
  }
}

function writeIds(key: string, ids: number[]) {
  localStorage.setItem(key, JSON.stringify(ids))
}

export function loadPinnedIds(): number[] {
  return readIds(PIN_KEY)
}

export function loadArchivedIds(): number[] {
  return readIds(ARCHIVE_KEY)
}

export function togglePinnedId(id: number): number[] {
  const cur = loadPinnedIds()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  writeIds(PIN_KEY, next)
  return next
}

export function toggleArchivedId(id: number): number[] {
  const cur = loadArchivedIds()
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
  writeIds(ARCHIVE_KEY, next)
  return next
}

export function hasLegacyPinArchivePrefs(): boolean {
  if (localStorage.getItem(LAYOUT_MIGRATED_KEY)) return false
  return loadPinnedIds().length > 0 || loadArchivedIds().length > 0
}

export function markLayoutMigratedFromLegacy() {
  localStorage.setItem(LAYOUT_MIGRATED_KEY, '1')
}

export function clearLegacyPinArchiveKeys() {
  localStorage.removeItem(PIN_KEY)
  localStorage.removeItem(ARCHIVE_KEY)
}
