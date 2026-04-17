/** Compact English labels, e.g. `3d ago`, `2h ago`. */
export function formatShortRelative(iso: string | null): string {
  if (!iso) return '—'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return '—'
  const diffMs = Date.now() - then
  const sec = Math.round(diffMs / 1000)
  if (Math.abs(sec) < 45) return 'just now'
  const min = Math.round(diffMs / 60000)
  if (Math.abs(min) < 60) return `${Math.abs(min)}m ago`
  const hr = Math.round(diffMs / 3600000)
  if (Math.abs(hr) < 24) return `${Math.abs(hr)}h ago`
  const day = Math.round(diffMs / 86400000)
  if (Math.abs(day) < 30) return `${Math.abs(day)}d ago`
  const month = Math.round(day / 30)
  if (Math.abs(month) < 12) return `${Math.abs(month)}mo ago`
  const year = Math.round(month / 12)
  return `${Math.abs(year)}y ago`
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'Unknown'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Unknown'
  const now = Date.now()
  const diffSec = Math.round((then - now) / 1000)
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, 'second')
  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour')
  const diffDay = Math.round(diffHr / 24)
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day')
  const diffMonth = Math.round(diffDay / 30)
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')
  const diffYear = Math.round(diffMonth / 12)
  return rtf.format(diffYear, 'year')
}
