export type SettingsOut = {
  projects_root: string
  last_scan_at: string | null
}

export type BoardSection = 'starred' | 'projects' | 'archived'

export type ProjectOut = {
  id: number
  name: string
  path: string
  description: string
  icon: string
  is_imported: boolean
  last_updated: string | null
  board_section: BoardSection
  board_order: number
  /** Browsable https URL from git remote origin, when available. */
  repo_url: string | null
}

export type GitResultOut = {
  exit_code: number
  stdout: string
  stderr: string
}

export type ScanResultOut = {
  scanned_count: number
  last_scan_at: string | null
}

export type ListeningPortOut = {
  port: number
  name: string
  tech: string
  pid: number | null
}

export type PortKillOut = {
  ok: boolean
  message: string
}

export type PortLogsOut = {
  text: string
  source: string
}
