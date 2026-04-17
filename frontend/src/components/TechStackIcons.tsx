import type { TechId } from '../lib/projectMeta'

function IconWrap({
  children,
  title,
}: {
  children: React.ReactNode
  title: string
}) {
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800/80 dark:text-zinc-300 dark:ring-zinc-700/80"
      title={title}
    >
      {children}
    </span>
  )
}

function ReactIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-400" aria-hidden>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <ellipse
        cx="12"
        cy="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        rx="11"
        ry="4.2"
      />
      <ellipse
        cx="12"
        cy="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        rx="11"
        ry="4.2"
        transform="rotate(60 12 12)"
      />
      <ellipse
        cx="12"
        cy="12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        rx="11"
        ry="4.2"
        transform="rotate(-60 12 12)"
      />
    </svg>
  )
}

function NodeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" aria-hidden>
      <path
        fill="currentColor"
        d="M12 1L3 6v12l9 5 9-5V6l-9-5zm0 2.18l6.5 3.62v7.2L12 17.82l-6.5-3.62V6.8L12 3.18zM8.5 9.5v5l3.5 2 3.5-2v-5l-3.5 2-3.5-2z"
      />
    </svg>
  )
}

function RustIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-400" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2L4 6v12l8 4 8-4V6l-8-4zm0 2.2l5.5 3v8.6l-5.5 2.75L6.5 15.8V8.2L12 4.2z"
      />
    </svg>
  )
}

function DockerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-400" aria-hidden>
      <path
        fill="currentColor"
        d="M4 10h2v2H4v-2zm4-4h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zm4-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2zM4 14h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"
      />
    </svg>
  )
}

function VueIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400" aria-hidden>
      <path fill="currentColor" d="M2 3h4l6 10.5L18 3h4L12 21 2 3z" />
    </svg>
  )
}

function SvelteIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-300" aria-hidden>
      <path
        fill="currentColor"
        d="M15.5 3c-2 0-3.8 1.1-4.8 2.9L8 10.2c-.5 1-.8 2-.8 3.1 0 2.8 2.2 5 5 5 2 0 3.8-1.1 4.8-2.9l2.7-4.3c.5-1 .8-2 .8-3.1C20 5.2 17.8 3 15.5 3z"
      />
    </svg>
  )
}

const MAP: Record<TechId, { label: string; node: React.ReactNode }> = {
  python: {
    label: 'Python',
    node: <span className="text-[10px] font-bold text-blue-400">Py</span>,
  },
  react: { label: 'React', node: <ReactIcon /> },
  typescript: {
    label: 'TypeScript',
    node: <span className="text-[10px] font-bold tracking-tight text-blue-500">TS</span>,
  },
  node: { label: 'Node.js', node: <NodeIcon /> },
  go: { label: 'Go', node: <span className="text-[10px] font-bold text-cyan-400">Go</span> },
  rust: { label: 'Rust', node: <RustIcon /> },
  docker: { label: 'Docker', node: <DockerIcon /> },
  vue: { label: 'Vue', node: <VueIcon /> },
  svelte: { label: 'Svelte', node: <SvelteIcon /> },
}

export function TechStackIcons({ ids }: { ids: TechId[] }) {
  if (ids.length === 0) return null
  return (
    <div className="flex items-center gap-1" aria-label="Detected tech stack">
      {ids.map((id) => {
        const entry = MAP[id]
        if (!entry) return null
        return (
          <IconWrap key={id} title={entry.label}>
            {entry.node}
          </IconWrap>
        )
      })}
    </div>
  )
}
