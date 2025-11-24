"use client"

import { forwardRef } from "react"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { X, Users, Building2, Calendar, Clock, Lock, MapPin, Link as LinkIcon, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import { ResourceLinks } from "@/app/company/projects/[id]/_components/ResourceLinks"
import { ResourceFiles } from "@/app/company/projects/[id]/_components/ResourceFiles"
import { Project } from "./types"
import { getPastelColor, formatDate, getCompanyInitials, formatTeamSize, formatMaxTeams } from "./utils"

interface ProjectModalProps {
  project: Project
  onClose: () => void
  layoutId: string
}

export const ProjectModal = forwardRef<HTMLDivElement, ProjectModalProps>(
  ({ project, onClose, layoutId }, ref) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pastelColor = getPastelColor(project.company_id || project.id, isDark)
  const companyName = project.companies?.name || 'Unknown Company'
  const companyLogo = project.companies?.logo_url
  const skills = project.skills_needed || []

  return (
    <div ref={ref} className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
        onClick={onClose}
        data-testid="modal-overlay"
      />

      {/* Modal */}
      <div className="fixed inset-0 grid place-items-center z-[100] p-4 overflow-y-auto" onClick={onClose}>
        <motion.div
          layoutId={`card-${layoutId}`}
          className="w-full max-w-3xl max-h-[90vh] my-auto flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl rounded-xl overflow-hidden shadow-2xl relative"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full h-8 w-8 shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            data-testid="modal-close-btn"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Hero section with pastel background */}
          <motion.div
            className="p-8 relative"
            style={{ background: pastelColor }}
          >
            <div className="flex flex-col items-center gap-4">
              <motion.div layoutId={`avatar-${layoutId}`}>
                <Avatar className="h-16 w-16">
                  {companyLogo && <AvatarImage src={companyLogo} alt={companyName} />}
                  <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black font-semibold text-lg">
                    {getCompanyInitials(companyName)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>

              <motion.div layoutId={`company-${layoutId}`} className="text-center">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-100 flex items-center justify-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  {companyName}
                </p>
              </motion.div>

              <motion.h2
                layoutId={`title-${layoutId}`}
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center"
              >
                {project.title || 'Untitled Project'}
              </motion.h2>
            </div>
          </motion.div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Summary */}
            {project.short_summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {project.short_summary}
                </p>
              </motion.div>
            )}

            <Separator />

            {/* Details grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Team Size</span>
                </div>
                <p className="text-sm pl-6">{formatTeamSize(project.min_students, project.max_students)}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Max Teams</span>
                </div>
                <p className="text-sm pl-6">{formatMaxTeams(project.max_teams)}</p>
              </div>

              {project.weekly_hours && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Weekly Hours</span>
                  </div>
                  <p className="text-sm pl-6">{project.weekly_hours} hrs/week</p>
                </div>
              )}

              {(project.start_date || project.end_date) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Timeline</span>
                  </div>
                  <p className="text-sm pl-6">
                    {formatDate(project.start_date)} - {formatDate(project.end_date)}
                  </p>
                </div>
              )}

              {project.access_type && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium">Access</span>
                  </div>
                  <p className="text-sm pl-6 capitalize">{project.access_type.toLowerCase()}</p>
                </div>
              )}

              {(project.collaboration_style || project.location) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Collaboration</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pl-6">
                    {project.collaboration_style && (
                      <Badge variant="outline" className="text-xs">{project.collaboration_style}</Badge>
                    )}
                    {project.location && (
                      <Badge variant="outline" className="text-xs">{project.location}</Badge>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            <Separator />

            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Skills Needed</h3>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No skills specified</span>
                )}
              </div>
            </motion.div>

            {/* Deliverables */}
            {project.deliverables && (
              <>
                <Separator />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Deliverables
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap line-clamp-6">
                    {project.deliverables}
                  </p>
                </motion.div>
              </>
            )}

            {/* Resources */}
            {(project.resource_links || (project.resource_files && project.resource_files.length > 0)) && (
              <>
                <Separator />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Resources
                  </h3>
                  <div className="space-y-4">
                    {project.resource_links && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Links</div>
                        <ResourceLinks value={project.resource_links} />
                      </div>
                    )}
                    {project.resource_files && project.resource_files.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Files</div>
                        <ResourceFiles files={project.resource_files} projectId={project.id} />
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </div>

          {/* Footer CTA */}
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
            <Button asChild className="rounded-full px-8" data-testid={`view-full-details-btn-${project.id}`}>
              <Link href={`/company/projects/${project.id}`}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Full Details
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
})

ProjectModal.displayName = "ProjectModal"

