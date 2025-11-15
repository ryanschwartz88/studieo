'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { updateProjectStatus } from '@/lib/actions/projects'

type Status = 'INCOMPLETE' | 'SCHEDULED' | 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED'

const STATUS_LABELS: Record<Status, string> = {
  INCOMPLETE: 'Incomplete',
  SCHEDULED: 'Scheduled',
  ACCEPTING: 'Accepting',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
}

const INLINE_STATUSES: Status[] = ['INCOMPLETE', 'ACCEPTING', 'IN_PROGRESS', 'COMPLETED']

export function StatusDropdown({ projectId, value }: { projectId: string, value?: string | null }) {
  const [isPending, startTransition] = useTransition()
  const current = (value as Status) || 'INCOMPLETE'

  function setStatus(next: Status) {
    startTransition(async () => {
      await updateProjectStatus(projectId, next)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="uppercase tracking-wide" data-testid="status-dropdown" disabled={isPending}>
          {STATUS_LABELS[current]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {INLINE_STATUSES.map((s) => (
          <DropdownMenuItem key={s} onClick={() => setStatus(s)} data-testid={`status-option-${s}`}>
            {STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


