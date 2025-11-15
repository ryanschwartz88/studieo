"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Search, Plus } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavigationButtons() {
  const pathname = usePathname()
  const isBrowseActive = pathname === "/company/browse"
  const isAddProjectActive = pathname === "/company/projects/new"

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isBrowseActive}
            tooltip="Browse"
            className={cn(
              "px-3 py-2.5",
              isBrowseActive && "bg-sidebar-accent font-semibold"
            )}
          >
            <Link href="/company/browse" className="flex items-center">
              <Search />
              <span>Browse</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isAddProjectActive}
            tooltip="Add Project"
            className={cn(
              "px-3 py-2.5",
              isAddProjectActive && "bg-sidebar-accent font-semibold"
            )}
          >
            <Link href="/company/projects/new" data-testid="add-project" className="flex items-center">
              <Plus />
              <span>Add Project</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

