import type { LucideIcon } from 'lucide-react'
import {
  Box,
  Code2,
  Folder,
  FolderGit2,
  FolderKanban,
  LayoutGrid,
  Terminal,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  'folder-kanban': FolderKanban,
  folder: Folder,
  'folder-git': FolderGit2,
  box: Box,
  code: Code2,
  terminal: Terminal,
  grid: LayoutGrid,
}

export function ProjectIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = MAP[name] ?? FolderKanban
  return <Icon className={className} aria-hidden />
}
