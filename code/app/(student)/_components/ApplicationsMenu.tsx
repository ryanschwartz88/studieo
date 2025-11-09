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

type Application = {
  id: string
  projectTitle: string
  status: string
}

interface ApplicationsMenuProps {
  applications: Application[]
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
    PENDING: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    SUBMITTED: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  }
  
  const key = status.toUpperCase()
  return statusClasses[key] || statusClasses.PENDING
}

export function ApplicationsMenu({ applications }: ApplicationsMenuProps) {
  const pathname = usePathname()

  // Extract application ID from pathname if on an application page
  const currentApplicationId = pathname.startsWith('/applications/')
    ? pathname.split('/')[2]
    : null

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Applications</SidebarGroupLabel>
      <SidebarMenu>
        {applications.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            No applications yet
          </div>
        ) : (
          applications.map((application) => {
            const isActive = currentApplicationId === application.id
            
            return (
              <SidebarMenuItem key={application.id}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  className={cn(
                    "px-3 py-2.5",
                    isActive && "bg-sidebar-accent font-semibold"
                  )}
                >
                  <Link
                    href={`/applications/${application.id}`}
                    className="flex w-full items-center gap-2"
                    data-testid={`application-link-${application.id}`}
                  >
                    <span className="truncate flex-1">{application.projectTitle}</span>
                    <Badge
                      variant="outline"
                      className={cn("h-5 px-1.5 text-[10px] border", getStatusClasses(application.status))}
                    >
                      {getStatusLabel(application.status)}
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

