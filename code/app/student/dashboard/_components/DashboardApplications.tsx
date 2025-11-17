"use client"

import { useId, useRef, useState, useTransition, useEffect } from "react"
import { AnimatePresence } from "motion/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Carousel } from "@/components/ui/apple-cards-carousel"
import { ProjectCard } from "@/app/student/search/_components/ProjectCard"
import { ProjectModal } from "@/app/student/search/_components/ProjectModal"
import type { Project, StudentLimits } from "@/app/student/search/_components/types"
import type { ActiveApplicationItem, AcceptedProjectItem, CurrentUser } from "../page"
import { TrendingUp, Briefcase, CheckCircle2, Clock } from "lucide-react"
import { toggleSaveProject } from "@/lib/actions/saved-projects"
import { toast } from "sonner"
import { useOutsideClick } from "@/hooks/use-outside-click"

interface DashboardApplicationsProps {
  acceptedProjects: AcceptedProjectItem[]
  activeApplications: ActiveApplicationItem[]
  trendingProjects: Project[]
  savedProjectIds: string[]
  studentLimits: StudentLimits
  currentUser: CurrentUser
}

export function DashboardApplications({
  acceptedProjects,
  activeApplications,
  trendingProjects,
  savedProjectIds,
  studentLimits,
  currentUser,
}: DashboardApplicationsProps) {
  const id = useId()
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [activeProject, setActiveProject] = useState<Project | null>(null)
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(savedProjectIds))
  const [isPending, startTransition] = useTransition()

  // Keep savedIds in sync when props change (e.g. after navigation)
  useEffect(() => {
    setSavedIds(new Set(savedProjectIds))
  }, [savedProjectIds])

  const handleBookmarkToggle = (projectId: string) => {
    // Optimistic update
    const next = new Set(savedIds)
    if (next.has(projectId)) {
      next.delete(projectId)
    } else {
      next.add(projectId)
    }
    setSavedIds(next)

    startTransition(async () => {
      const result = await toggleSaveProject(projectId)
      if (!result.success) {
        // revert on error
        setSavedIds(savedIds)
        toast.error(result.error || "Failed to update bookmark")
      } else {
        toast.success(result.saved ? "Project saved" : "Project unsaved")
      }
    })
  }

  // Ensure activeProject reflects latest saved state
  useEffect(() => {
    if (activeProject) {
      setActiveProject({
        ...activeProject,
        is_saved: savedIds.has(activeProject.id),
      })
    }
  }, [savedIds])

  useOutsideClick(modalRef, () => setActiveProject(null))

  const openModal = (project: Project, layoutId: string) => {
    setActiveProject({
      ...project,
      is_saved: savedIds.has(project.id),
    })
    setActiveLayoutId(layoutId)
  }

  // Map projects with is_saved flag
  const trendingWithSaved = trendingProjects.map((project) => ({
    ...project,
    is_saved: savedIds.has(project.id),
  }))

  const activeWithSaved = activeApplications.map((item) => ({
    ...item,
    project: {
      ...item.project,
      is_saved: savedIds.has(item.project.id),
    },
  }))

  const acceptedWithSaved = acceptedProjects.map((item) => ({
    ...item,
    project: {
      ...item.project,
      is_saved: savedIds.has(item.project.id),
    },
  }))

  const hasActiveApplications = activeWithSaved.length > 0
  const hasAcceptedProjects = acceptedWithSaved.length > 0

  const acceptedItems = acceptedWithSaved.map((item) => {
    const { project } = item
    const layoutId = `${project.id}-accepted-${id}`

    return (
      <div key={item.applicationId} className="w-[280px] sm:w-[350px] flex-shrink-0 h-full">
        <ProjectCard
          project={project}
          onClick={() => openModal(project, layoutId)}
          onBookmarkToggle={handleBookmarkToggle}
          layoutId={layoutId}
        />
      </div>
    )
  })

  const activeItems = activeWithSaved.map((item) => {
    const { project } = item
    const layoutId = `${project.id}-active-${id}`

    return (
      <div key={item.applicationId} className="w-[280px] sm:w-[350px] flex-shrink-0 h-full">
        <ProjectCard
          project={project}
          onClick={() => openModal(project, layoutId)}
          onBookmarkToggle={handleBookmarkToggle}
          layoutId={layoutId}
        />
      </div>
    )
  })

  const trendingItems = trendingWithSaved.map((project) => {
    const layoutId = `${project.id}-trending-${id}`

    return (
      <div key={project.id} className="w-[280px] sm:w-[350px] flex-shrink-0 h-full">
        <ProjectCard
          project={project}
          onClick={() => openModal(project, layoutId)}
          onBookmarkToggle={handleBookmarkToggle}
          layoutId={layoutId}
        />
      </div>
    )
  })

  return (
    <div className="space-y-10">
            {/* Trending Projects */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <h2 className="text-2xl font-bold">Trending Projects</h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/search">Browse All</Link>
          </Button>
        </div>

        {trendingWithSaved.length > 0 ? (
          <div className="h-[460px]">
            <Carousel items={trendingItems} />
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 space-y-2">
              <Briefcase className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No trending projects yet. Check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
      
      {/* Accepted Projects */}
      {hasAcceptedProjects && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-2xl font-bold">My Projects</h2>
            </div>
          </div>

          <div className="h-[460px]">
            <Carousel items={acceptedItems} />
          </div>
        </section>
      )}

      {/* Active Applications */}
      {hasActiveApplications && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Active Applications</h2>
            </div>
          </div>

          <div className="h-[460px]">
            <Carousel items={activeItems} />
          </div>
        </section>
      )}

      {/* Empty state when no accepted or active applications */}
      {!hasActiveApplications && !hasAcceptedProjects && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active applications yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start exploring projects and apply to get started
            </p>
            <Button asChild>
              <Link href="/student/search">Browse Projects</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Shared modal for all contexts */}
      <AnimatePresence>
        {activeProject && activeLayoutId && (
          <ProjectModal
            key={activeProject.id}
            ref={modalRef}
            project={activeProject}
            onClose={() => setActiveProject(null)}
            onBookmarkToggle={handleBookmarkToggle}
            studentLimits={studentLimits}
            currentUser={currentUser}
            layoutId={activeLayoutId}
          />
        )}
      </AnimatePresence>
    </div>
  )
}


