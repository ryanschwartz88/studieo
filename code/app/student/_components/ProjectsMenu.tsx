"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"

type Project = {
  applicationId: string
  projectId: string
  projectTitle: string
  applicationStatus: string
}

interface ProjectsMenuProps {
  projects: Project[]
  count: number
  maxCount: number
}

const getStatusLabel = (status: string) => {
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const getStatusClasses = (status: string): string => {
  const statusClasses: Record<string, string> = {
    ACCEPTED: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    ACCEPTING: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    IN_PROGRESS: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  }
  
  const key = status.toUpperCase()
  return statusClasses[key] || statusClasses.ACCEPTED
}

export function ProjectsMenu({ projects, count, maxCount }: ProjectsMenuProps) {
  const pathname = usePathname()

  // Extract project ID from pathname if on a project page
  const currentProjectId = pathname.startsWith('/student/projects/')
    ? pathname.split('/')[3]
    : null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>Projects</span>
        <span className="text-xs text-muted-foreground font-normal">{count}/{maxCount}</span>
      </SidebarGroupLabel>
      <SidebarMenu>
        {projects.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No active projects
          </div>
        ) : (
          projects.map((project) => {
            const isActive = currentProjectId === project.projectId
            
            return (
              <SidebarMenuItem key={project.applicationId}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "px-3 py-2.5",
                    isActive && "bg-sidebar-accent font-semibold"
                  )}
                >
                  <Link
                    href={`/student/projects/${project.projectId}`}
                    className="flex w-full items-center gap-2"
                    data-testid={`project-link-${project.projectId}`}
                  >
                    <span className="truncate flex-1">{project.projectTitle}</span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 px-1.5 text-[10px] border", getStatusClasses(project.applicationStatus))}
                    >
                      {getStatusLabel(project.applicationStatus)}
                    </Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

