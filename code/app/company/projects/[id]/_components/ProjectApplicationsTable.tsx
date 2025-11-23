"use client"

import { useState, useMemo, useTransition } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "@/components/animate-ui/primitives/base/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Search, ChevronLeft, ChevronRight, Filter, Eye, ChevronDown, MoreHorizontal, Trash2 } from "lucide-react"
import { Application } from "./ApplicationCard"
import { ApplicationDetailModal } from "./ApplicationDetailModal"
import { formatRelativeTime, getInitials } from "./utils"
import { cn } from "@/lib/utils"
import { deleteApplication } from "@/lib/actions/applications"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProjectApplicationsTableProps {
  applications: Application[]
  projectId: string
  project?: {
    custom_questions?: { id: string; question: string; required: boolean }[]
  }
}

export function ProjectApplicationsTable({ applications, projectId, project }: ProjectApplicationsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()
  const itemsPerPage = 10

  // Filter and search logic
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Status filter
      if (statusFilter !== "all" && statusFilter !== "review" && app.status !== statusFilter.toUpperCase()) {
        return false
      }
      if (statusFilter === "review" && app.status !== "SUBMITTED") {
        return false
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const teamLead = app.users || app.team_members.find(m => m.is_lead)?.users
        const leadName = teamLead?.name?.toLowerCase() || ""
        const leadEmail = teamLead?.email?.toLowerCase() || ""
        
        return leadName.includes(query) || leadEmail.includes(query)
      }

      return true
    })
  }, [applications, searchQuery, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage)
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const handleDelete = () => {
    if (!applicationToDelete) return

    startDeleteTransition(async () => {
      const result = await deleteApplication(applicationToDelete)
      if (result.success) {
        toast.success("Application deleted successfully")
        router.refresh()
        setApplicationToDelete(null)
      } else {
        toast.error(result.error || "Failed to delete application")
      }
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "default"
      case "ACCEPTED":
        return "outline"
      case "REJECTED":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center justify-between px-6 py-4">
            <div className="space-y-1">
              <CardTitle>Applications</CardTitle>
              <CardDescription>
                Manage and review student applications for this project.
              </CardDescription>
            </div>
            <CollapsibleTrigger className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-9 p-0")}>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
              <span className="sr-only">Toggle</span>
            </CollapsibleTrigger>
          </div>
          
          <CollapsiblePanel>
            <CardContent className="pt-0">
              <div className="flex flex-col space-y-4">
                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center pt-2">
                  <div className="relative w-full sm:w-72 group">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      placeholder="Search applications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-background">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                          <span>All</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="review">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span>To Review</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="accepted">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span>Accepted</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span>Rejected</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                  <ScrollArea className="h-auto max-h-[500px]">
                    <Table>
                      <TableHeader className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                        <TableRow className="hover:bg-transparent border-b border-border/50">
                          <TableHead className="w-[300px]">Applicant</TableHead>
                          <TableHead>Team Size</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedApplications.length > 0 ? (
                          paginatedApplications.map((app) => {
                            const teamLead = app.users || app.team_members.find(m => m.is_lead)?.users
                            const teamSize = app.team_members.length
                            
                            return (
                              <TableRow 
                                key={app.id} 
                                className="hover:bg-muted/50 cursor-pointer transition-colors" 
                                onClick={() => setSelectedApplication(app)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border-2 border-background">
                                      <AvatarImage src="" alt={teamLead?.name || "Unknown"} />
                                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                        {getInitials(teamLead?.name || "UK")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-foreground">
                                        {teamLead?.name || "Unknown"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {teamLead?.email || ""}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{teamSize}</span>
                                    <span className="text-xs text-muted-foreground">{teamSize === 1 ? 'member' : 'members'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm text-muted-foreground">
                                    {formatRelativeTime(app.created_at)}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={getStatusBadgeVariant(app.status)}
                                    className="capitalize shadow-none"
                                  >
                                    {app.status === 'SUBMITTED' ? 'To Review' : app.status.toLowerCase()}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedApplication(app)
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setApplicationToDelete(app.id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete Application
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center">
                              <div className="flex flex-col items-center justify-center text-muted-foreground">
                                <Search className="h-8 w-8 mb-2 opacity-20" />
                                <p>No applications found matching your criteria.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2">
                    <div className="text-sm text-muted-foreground mr-2">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsiblePanel>
        </Collapsible>
      </Card>

      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          projectId={projectId}
          project={project}
          open={!!selectedApplication}
          onOpenChange={(open) => !open && setSelectedApplication(null)}
        />
      )}

      <AlertDialog open={!!applicationToDelete} onOpenChange={(open) => !open && setApplicationToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this application. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
