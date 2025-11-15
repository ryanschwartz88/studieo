"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatRelativeTime, getInitials } from "./utils"

export interface NewApplication {
  id: string
  created_at: string
  status: string
  projects: {
    id: string
    title: string
    project_type: string[]
  } | null
  users: {
    name: string
    email: string
  } | null
}

interface NewApplicationsTableProps {
  applications: NewApplication[]
}

export function NewApplicationsTable({ applications }: NewApplicationsTableProps) {
  if (applications.length === 0) {
    return (
      <Card data-testid="dashboard-new-applications-table">
        <CardHeader>
          <CardTitle>New Applications</CardTitle>
          <CardDescription>
            Recent applications you haven't reviewed yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No new applications at the moment
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Applications will appear here when students submit them
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="dashboard-new-applications-table">
      <CardHeader>
        <CardTitle>New Applications</CardTitle>
        <CardDescription>
          Recent applications you haven't reviewed yet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Lead</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Applied</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((application) => {
              const teamLead = application.users
              const project = application.projects
              
              return (
                <TableRow
                  key={application.id}
                  data-testid={`application-row-${application.id}`}
                  className="hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={teamLead?.name || "Unknown"} />
                        <AvatarFallback className="text-xs">
                          {getInitials(teamLead?.name || "UK")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {teamLead?.name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {teamLead?.email || ""}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-medium">
                        {project?.title || "Unknown Project"}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(project?.project_type || []).slice(0, 2).map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="text-xs"
                          >
                            {type}
                          </Badge>
                        ))}
                        {(project?.project_type || []).length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(project?.project_type || []).length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(application.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        application.status === "SUBMITTED"
                          ? "default"
                          : application.status === "ACCEPTED"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {application.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="hover:bg-accent"
                    >
                      <Link href={`/company/projects/${project?.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

