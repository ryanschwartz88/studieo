'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

type EditableProject = {
  id: string
  title: string | null
  short_summary: string | null
  detailed_description: string | null
  deliverables: string | null
  resource_links: string | null
}

interface ProjectEditToolbarProps {
  project: EditableProject
}

export function ProjectEditToolbar({ project }: ProjectEditToolbarProps) {
  return (
    <Link href={`/projects/${project.id}/edit`}>
      <Button
        data-testid="edit-project"
        variant="outline"
        className="group transition-all duration-200 ease-out hover:shadow-md hover:-translate-y-0.5"
        aria-label="Edit"
      >
        <Pencil className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-110" />
        Edit
      </Button>
    </Link>
  )
}


