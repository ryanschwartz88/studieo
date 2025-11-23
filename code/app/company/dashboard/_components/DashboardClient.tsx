"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { FolderKanban, Activity, Bell, Eye } from "lucide-react"
import { ApplicationsChart, ChartDataPoint } from "./ApplicationsChart"
import { NewApplicationsTable, NewApplication } from "./NewApplicationsTable"

interface DashboardStats {
  viewToApplyRate: number
  activeProjects: number
  pendingApplications: number
  totalViews: number
}

interface DashboardClientProps {
  stats: DashboardStats
  chartData: ChartDataPoint[]
  newApplications: NewApplication[]
}

export function DashboardClient({
  stats,
  chartData,
  newApplications,
}: DashboardClientProps) {
  const statCards = [
    {
      name: "View-to-Apply Rate",
      value: stats.viewToApplyRate,
      icon: Eye,
      description: "Conversion percentage",
      testId: "dashboard-stat-view-to-apply",
      suffix: "%",
      decimals: 1,
    },
    {
      name: "Active Projects",
      value: stats.activeProjects,
      icon: Activity,
      description: "Open or in progress",
      testId: "dashboard-stat-active-projects",
    },
    {
      name: "Pending Review",
      value: stats.pendingApplications,
      icon: Bell,
      description: "New applications",
      testId: "dashboard-stat-pending-applications",
    },
    {
      name: "Total Views",
      value: stats.totalViews,
      icon: FolderKanban,
      description: "Project impressions",
      testId: "dashboard-stat-total-views",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 w-full">
        {statCards.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.name}
              className="group p-6 py-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              data-testid={item.testId}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {item.name}
                  </dt>
                  <Icon className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
                </div>
                <dd className="mt-2 flex items-baseline space-x-2.5">
                  <span className="text-3xl font-semibold text-foreground tabular-nums flex items-baseline">
                    <AnimatedNumber
                      value={item.value}
                      mass={0.8}
                      stiffness={75}
                      damping={15}
                    />
                    {item.suffix && <span>{item.suffix}</span>}
                  </span>
                </dd>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </dl>

      {/* Applications Chart */}
      <ApplicationsChart data={chartData} />

      {/* New Applications Table */}
      <NewApplicationsTable applications={newApplications} />
    </div>
  )
}

