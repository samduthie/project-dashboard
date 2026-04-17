import type {
  GitResultOut,
  ListeningPortOut,
  PortKillOut,
  PortLogsOut,
  ProjectOut,
  ScanResultOut,
  SettingsOut,
} from './types'

const API = '/api'

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!res.ok) {
    let detail = text
    try {
      const j = JSON.parse(text) as { detail?: unknown }
      if (typeof j.detail === 'string') {
        detail = j.detail
      } else if (Array.isArray(j.detail) && j.detail.length > 0) {
        const first = j.detail[0] as { msg?: string }
        if (typeof first?.msg === 'string') detail = first.msg
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`)
  }
  return text ? (JSON.parse(text) as T) : ({} as T)
}

export async function getSettings(): Promise<SettingsOut> {
  const res = await fetch(`${API}/settings`)
  return parseJson<SettingsOut>(res)
}

export async function patchSettings(projects_root: string): Promise<SettingsOut> {
  const res = await fetch(`${API}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projects_root }),
  })
  return parseJson<SettingsOut>(res)
}

export async function listProjects(): Promise<ProjectOut[]> {
  const res = await fetch(`${API}/projects`)
  return parseJson<ProjectOut[]>(res)
}

export async function saveDashboardLayout(body: {
  starred: number[]
  projects: number[]
  archived: number[]
}): Promise<ProjectOut[]> {
  const res = await fetch(`${API}/projects/dashboard-layout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<ProjectOut[]>(res)
}

export async function listListeningPorts(): Promise<ListeningPortOut[]> {
  const res = await fetch(`${API}/ports`)
  return parseJson<ListeningPortOut[]>(res)
}

export async function killPort(port: number): Promise<PortKillOut> {
  const res = await fetch(`${API}/ports/${port}/kill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  return parseJson<PortKillOut>(res)
}

export async function getPortLogs(port: number): Promise<PortLogsOut> {
  const res = await fetch(`${API}/ports/${port}/logs`)
  return parseJson<PortLogsOut>(res)
}

export async function scanProjects(): Promise<ScanResultOut> {
  const res = await fetch(`${API}/projects/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  return parseJson<ScanResultOut>(res)
}

export async function importProject(path: string): Promise<ProjectOut> {
  const res = await fetch(`${API}/projects/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  return parseJson<ProjectOut>(res)
}

export async function updateProject(
  projectId: number,
  body: { description?: string; name?: string; icon?: string },
): Promise<ProjectOut> {
  const res = await fetch(`${API}/projects/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parseJson<ProjectOut>(res)
}

export async function gitPull(projectId: number): Promise<GitResultOut> {
  const res = await fetch(`${API}/git/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  })
  return parseJson<GitResultOut>(res)
}

export async function gitPush(projectId: number): Promise<GitResultOut> {
  const res = await fetch(`${API}/git/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  })
  return parseJson<GitResultOut>(res)
}
