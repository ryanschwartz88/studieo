"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { cn } from "@/lib/utils"
import { Users, FileCheck, Eye } from "lucide-react"

interface ProjectStatsProps {
  totalApplicants: number
  toReview: number
  impressions: number
}

export function ProjectStats({ totalApplicants, toReview, impressions }: ProjectStatsProps) {
  const stats = [
    {
      name: "Total Applicants",
      value: totalApplicants,
      icon: Users,
      description: "Students who applied",
    },
    {
      name: "To Review",
      value: toReview,
      icon: FileCheck,
      description: "New applications",
    },
    {
      name: "Impressions",
      value: impressions,
      icon: Eye,
      description: "Project views",
    },
  ]

  return (
    <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 w-full">
      {stats.map((item) => {
        const Icon = item.icon
        return (
          <Card 
            key={item.name} 
            className="group p-6 py-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            data-testid={`stat-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <dt className="text-sm font-medium text-muted-foreground">
                  {item.name}
                </dt>
                <Icon className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </div>
              <dd className="mt-2 flex items-baseline space-x-2.5">
                <span className="text-3xl font-semibold text-foreground tabular-nums">
                  <AnimatedNumber 
                    value={item.value}
                    mass={0.8}
                    stiffness={75}
                    damping={15}
                  />
                </span>
              </dd>
              <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        )
      })}
    </dl>
  )
}

