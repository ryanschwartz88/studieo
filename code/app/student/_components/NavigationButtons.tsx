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
  const isDashboardActive = pathname === "/student/dashboard"
  const isBrowseActive = pathname === "/student/search" || pathname.startsWith("/student/search/")

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
            <Link href="/student/dashboard" className="flex items-center" data-testid="dashboard-link">
              <LayoutDashboard />
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            isActive={isBrowseActive}
            tooltip="Search"
            className={cn(
              "px-3 py-2.5",
              isBrowseActive && "bg-sidebar-accent font-semibold"
            )}
          >
            <Link href="/student/search" className="flex items-center" data-testid="search-link">
              <Search />
              <span>Search</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

