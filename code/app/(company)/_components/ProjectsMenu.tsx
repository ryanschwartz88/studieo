"use client"

import Link from "next/link"
import { MoreHorizontal, Folder, Edit, Archive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  return status
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "INCOMPLETE":
      return "secondary"
    case "OPEN":
      return "default"
    case "IN_PROGRESS":
      return "outline"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED":
      return "destructive"
    default:
      return "secondary"
  }
}

export function ProjectsMenu({ projects, pendingCounts = {} }: ProjectsMenuProps) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {projects.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No projects yet
          </div>
        ) : (
          projects.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex w-full items-center gap-2"
                  data-testid={`project-link-${project.id}`}
                >
                  <span className="truncate flex-1">{project.title}</span>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={getStatusVariant(project.status)}
                      className="h-5 px-1.5 text-[10px]"
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
                    <Link href={`/projects/${project.id}`}>
                      <Edit className="text-muted-foreground" />
                      <span>Edit Project</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Archive className="text-muted-foreground" />
                    <span>Archive Project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
