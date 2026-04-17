import type { ProjectOut } from '../api/types'

/** Primary dashboard chip: stack + intent (colours: blue / teal / orange / purple / grey). */
export type ProjectChipKind = 'fastapi' | 'django' | 'react' | 'blog' | 'tool'

const CHIP_STYLES: Record<
  ProjectChipKind,
  {
    label: string
    stripe: string
    tag: string
    avatar: string
    ring: string
    /** Section header in ports panel */
    header: string
  }
> = {
  fastapi: {
    label: 'FastAPI',
    stripe: 'bg-blue-500',
    tag: 'bg-blue-500/15 text-blue-700 ring-blue-500/25 dark:text-blue-300 dark:ring-blue-500/30',
    avatar: 'bg-indigo-600/90 text-white',
    ring: 'ring-indigo-500/35',
    header: 'text-indigo-600 dark:text-indigo-400',
  },
  django: {
    label: 'Django',
    stripe: 'bg-orange-500',
    tag: 'bg-orange-500/15 text-orange-800 ring-orange-500/25 dark:text-orange-300 dark:ring-orange-500/30',
    avatar: 'bg-amber-600/90 text-white',
    ring: 'ring-amber-500/35',
    header: 'text-amber-700 dark:text-amber-400',
  },
  react: {
    label: 'React',
    stripe: 'bg-teal-500',
    tag: 'bg-teal-500/15 text-teal-800 ring-teal-500/25 dark:text-teal-300 dark:ring-teal-500/30',
    avatar: 'bg-emerald-600/90 text-white',
    ring: 'ring-emerald-500/35',
    header: 'text-emerald-700 dark:text-emerald-400',
  },
  blog: {
    label: 'Blog',
    stripe: 'bg-purple-500',
    tag: 'bg-purple-500/15 text-purple-800 ring-purple-500/25 dark:text-purple-300 dark:ring-purple-500/30',
    avatar: 'bg-rose-600/90 text-white',
    ring: 'ring-rose-500/35',
    header: 'text-rose-600 dark:text-rose-400',
  },
  tool: {
    label: 'Tool',
    stripe: 'bg-zinc-400 dark:bg-zinc-500',
    tag: 'bg-zinc-500/15 text-zinc-700 ring-zinc-500/25 dark:text-zinc-300 dark:ring-zinc-500/30',
    avatar: 'bg-zinc-600/90 text-white',
    ring: 'ring-zinc-500/30',
    header: 'text-zinc-600 dark:text-zinc-400',
  },
}

export function inferProjectChip(project: ProjectOut): ProjectChipKind {
  const s = `${project.name} ${project.path}`.toLowerCase()
  if (/\b(blog|ghost|wordpress|jekyll|hugo)\b/.test(s)) {
    return 'blog'
  }
  if (/\bdjango\b/.test(s)) {
    return 'django'
  }
  if (/\b(fastapi|uvicorn|starlette)\b/.test(s)) {
    return 'fastapi'
  }
  if (
    /\b(react|next\.js|next\/|vue|nuxt|svelte|vite|webpack|frontend)\b/.test(s) ||
    /\.(tsx|jsx|vue|svelte)\b/.test(s)
  ) {
    return 'react'
  }
  return 'tool'
}

export function getProjectChipStyles(kind: ProjectChipKind) {
  return CHIP_STYLES[kind]
}

export type ProjectCategory = 'api' | 'frontend' | 'ai' | 'other'

const CATEGORY_STYLES: Record<
  ProjectCategory,
  {
    label: string
    stripe: string
    tag: string
    avatar: string
    ring: string
  }
> = {
  api: {
    label: 'API',
    stripe: 'bg-sky-500',
    tag: 'bg-sky-500/15 text-sky-300 ring-sky-500/25',
    avatar: 'bg-sky-600 text-white',
    ring: 'ring-sky-500/30',
  },
  frontend: {
    label: 'Frontend',
    stripe: 'bg-emerald-500',
    tag: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
    avatar: 'bg-emerald-600 text-white',
    ring: 'ring-emerald-500/30',
  },
  ai: {
    label: 'AI / ML',
    stripe: 'bg-violet-500',
    tag: 'bg-violet-500/15 text-violet-300 ring-violet-500/25',
    avatar: 'bg-violet-600 text-white',
    ring: 'ring-violet-500/30',
  },
  other: {
    label: 'Project',
    stripe: 'bg-zinc-400 dark:bg-zinc-500',
    tag: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/25',
    avatar: 'bg-zinc-600 text-white',
    ring: 'ring-zinc-500/30',
  },
}

export function getCategoryStyles(category: ProjectCategory) {
  return CATEGORY_STYLES[category]
}

export function inferCategory(project: ProjectOut): ProjectCategory {
  const s = `${project.name} ${project.path}`.toLowerCase()
  if (
    /\b(ml|ai|llm|gpt|neural|torch|tensorflow|keras|pytorch|langchain|huggingface|hf_|\.venv.*ml)\b/.test(
      s,
    )
  ) {
    return 'ai'
  }
  if (
    /\b(api|backend|fastapi|django|flask|nestjs|express|graphql|grpc|openapi|swagger)\b/.test(s)
  ) {
    return 'api'
  }
  if (
    /\b(frontend|react|vue|svelte|next|nuxt|vite|webpack|angular|ember|ui\/|client)\b/.test(s)
  ) {
    return 'frontend'
  }
  return 'other'
}

export function projectInitials(name: string): string {
  const parts = name.split(/[\s\-_/]+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  const w = name.replace(/[^a-zA-Z0-9]/g, '')
  if (w.length >= 2) return w.slice(0, 2).toUpperCase()
  return (name.slice(0, 2) || '?').toUpperCase()
}

export type TechId =
  | 'python'
  | 'react'
  | 'typescript'
  | 'node'
  | 'go'
  | 'rust'
  | 'docker'
  | 'vue'
  | 'svelte'

export type DetectedTech = { id: TechId; short: string }

export function detectTechStack(project: ProjectOut): DetectedTech[] {
  const s = `${project.name} ${project.path}`.toLowerCase()
  const found = new Map<TechId, DetectedTech>()

  const add = (id: TechId, short: string) => {
    if (!found.has(id)) found.set(id, { id, short })
  }

  if (/python|django|fastapi|flask|\.py\b|pyproject|pip|uv\b/.test(s)) add('python', 'Py')
  if (/react|next\.js|next\/|\.tsx\b|jsx/.test(s)) add('react', 'React')
  if (/typescript|\.ts\b|tsconfig/.test(s)) add('typescript', 'TS')
  if (/node|npm|pnpm|yarn|package\.json/.test(s)) add('node', 'Node')
  if (/go\.mod|golang|\/go\//.test(s)) add('go', 'Go')
  if (/rust|cargo\.toml|\.rs\b/.test(s)) add('rust', 'Rust')
  if (/docker|dockerfile|compose\.ya?ml/.test(s)) add('docker', 'Docker')
  if (/vue|nuxt|\.vue\b/.test(s)) add('vue', 'Vue')
  if (/svelte|sveltekit/.test(s)) add('svelte', 'Svelte')

  return [...found.values()].slice(0, 4)
}

/** Hours since last update; Infinity if unknown */
export function hoursSinceUpdate(iso: string | null): number {
  if (!iso) return Infinity
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return Infinity
  return (Date.now() - t) / 36e5
}

export function isRecentlyActive(iso: string | null, maxHours = 72): boolean {
  const h = hoursSinceUpdate(iso)
  return h !== Infinity && h <= maxHours
}
