"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MoreHorizontal, Folder, Edit, Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { archiveProject } from "@/lib/actions/projects"
import { toast } from "sonner"
import { useState, useTransition } from "react"

type Project = {
  id: string
  title: string
  status: string
  created_by_id: string | null
}

interface ProjectsMenuProps {
  projects: Project[]
  pendingCounts?: Record<string, number>
}

const getStatusLabel = (status: string) => {
  if (status === "INCOMPLETE") return "Draft"
  if (status === "ARCHIVED") return "Archived"
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const getStatusClasses = (status: string): string => {
  const statusClasses: Record<string, string> = {
    INCOMPLETE: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    SCHEDULED: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    OPEN: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    ACCEPTING: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    COMPLETED: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    ARCHIVED: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  }
  
  const key = status.toUpperCase()
  return statusClasses[key] || statusClasses.COMPLETED
}

export function ProjectsMenu({ projects, pendingCounts = {} }: ProjectsMenuProps) {
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [archivingId, setArchivingId] = useState<string | null>(null)

  // Extract project ID from pathname if on a project page
  const currentProjectId = pathname.startsWith('/projects/') && pathname !== '/projects/new'
    ? pathname.split('/')[2]
    : null

  const handleArchive = async (projectId: string) => {
    if (archivingId === projectId) return // Prevent double-clicks
    
    setArchivingId(projectId)
    startTransition(async () => {
      const result = await archiveProject(projectId)
      setArchivingId(null)
      
      if (result.success) {
        toast.success(result.message || 'Project archived successfully')
      } else {
        toast.error(result.error || 'Failed to archive project')
      }
    })
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No projects yet
          </div>
        ) : (
          projects
            .filter((p) => p.status !== 'ARCHIVED')
            .map((project) => {
            const isActive = currentProjectId === project.id
            const isArchiving = archivingId === project.id
            
            return (
              <SidebarMenuItem key={project.id}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "px-3 py-2.5",
                    isActive && "bg-sidebar-accent font-semibold"
                  )}
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex w-full items-center gap-2"
                    data-testid={`project-link-${project.id}`}
                  >
                    <span className="truncate flex-1">{project.title}</span>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn("h-5 px-1.5 text-[10px] border", getStatusClasses(project.status))}
                      >
                        {getStatusLabel(project.status)}
                      </Badge>
                      {pendingCounts[project.id] ? (
                        <Badge className="h-5 px-1.5 text-[10px]" variant="secondary">
                          {pendingCounts[project.id]}
                        </Badge>
                      ) : null}
                    </div>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover>
                      <MoreHorizontal />
                      <span className="sr-only">More</span>
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-lg"
                    side="right"
                    align="start"
                  >
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}`}>
                        <Folder className="text-muted-foreground" />
                        <span>View Project</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Edit className="text-muted-foreground" />
                        <span>Edit Project</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleArchive(project.id)}
                      disabled={isArchiving || isPending || project.status === 'ARCHIVED'}
                    >
                      <Archive className="text-muted-foreground" />
                      <span>{isArchiving ? 'Archiving...' : 'Archive Project'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
