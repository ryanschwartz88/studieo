"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Search } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavigationButtons() {
  const pathname = usePathname()
  const isDashboardActive = pathname === "/dashboard"
  const isBrowseActive = pathname === "/browse"

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isDashboardActive}
            tooltip="Dashboard"
            className={cn(
              "px-3 py-2.5",
              isDashboardActive && "bg-sidebar-accent font-semibold"
            )}
          >
            <Link href="/dashboard" className="flex items-center" data-testid="dashboard-link">
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
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
            <Link href="/browse" className="flex items-center" data-testid="browse-link">
              <Search />
              <span>Browse</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

