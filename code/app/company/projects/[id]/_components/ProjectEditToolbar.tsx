'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Pencil, 
  MoreHorizontal, 
  CheckCircle2, 
  Trash2, 
  Loader2 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteProject, completeProject } from '@/lib/actions/projects'

type EditableProject = {
  id: string
  title: string | null
  short_summary: string | null
  detailed_description: string | null
  deliverables: string | null
  resource_links: string | null
  status?: string
  end_date?: string | null
}

interface ProjectEditToolbarProps {
  project: EditableProject
}

export function ProjectEditToolbar({ project }: ProjectEditToolbarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [showCompleteAlert, setShowCompleteAlert] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProject(project.id)
      if (result.success) {
        toast.success("Project deleted successfully")
        router.push('/company/dashboard')
      } else {
        toast.error(result.error || "Failed to delete project")
      }
    })
  }

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeProject(project.id)
      if (result.success) {
        toast.success("Project marked as completed")
        setShowCompleteAlert(false)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update project")
      }
    })
  }

  const isCompleted = project.status === 'COMPLETED'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            data-testid="project-actions"
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-muted/50 hover:bg-muted"
            aria-label="Project Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/company/projects/${project.id}/edit`} className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" />
              Edit Project
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {!isCompleted && (
            <DropdownMenuItem 
              onClick={() => setShowCompleteAlert(true)}
              className="cursor-pointer"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark as Completed
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteAlert(true)}
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Project
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Complete Confirmation */}
      <AlertDialog open={showCompleteAlert} onOpenChange={setShowCompleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark project as completed?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the project status to COMPLETED and update the end date to today. 
              This indicates the project is finished.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleComplete()
              }}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Mark as Completed"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              and all associated data including applications and team assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


