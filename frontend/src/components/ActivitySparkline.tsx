import { useMemo } from 'react'

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i)!
  return h >>> 0
}

/** Deterministic mini bars from project id + last update — reads as vague “activity” */
export function ActivitySparkline({
  seedKey,
  active,
}: {
  seedKey: string
  active: boolean
}) {
  const heights = useMemo(() => {
    const seed = hashSeed(seedKey)
    const out: number[] = []
    let x = seed || 1
    for (let i = 0; i < 14; i++) {
      x ^= x << 13
      x ^= x >>> 17
      x ^= x << 5
      out.push(0.25 + ((x >>> 0) % 75) / 100)
    }
    return out
  }, [seedKey])

  if (!active) {
    return (
      <div
        className="relative flex h-5 w-full min-w-[4.5rem] items-end"
        aria-hidden
        title="No recent activity"
      >
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 border-b border-dashed border-zinc-300/70 dark:border-zinc-600/70"
          style={{ bottom: '2px' }}
        />
        <div className="flex h-full w-full items-end gap-px opacity-[0.22]">
          {heights.map((_, i) => (
            <div
              key={i}
              className="w-0.5 rounded-sm bg-zinc-400 dark:bg-zinc-500"
              style={{ height: '18%' }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="group/spark flex h-5 items-end gap-px"
      aria-hidden
      title="Active recently"
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-0.5 rounded-sm bg-gradient-to-t from-emerald-600/40 to-emerald-400/90 transition-[height,opacity] duration-300 dark:from-emerald-500/30 dark:to-emerald-300/80"
          style={{ height: `${Math.round(h * 100)}%`, opacity: 0.35 + h * 0.45 }}
        />
      ))}
    </div>
  )
}
