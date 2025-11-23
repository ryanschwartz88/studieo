"use client"

import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Project } from "./types"
import { getPastelColor, formatDate, getCompanyInitials, formatTeamSize, formatMaxTeams } from "./utils"

interface ProjectCardProps {
  project: Project
  onClick: () => void
  layoutId: string
}

export function ProjectCard({ project, onClick, layoutId }: ProjectCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pastelColor = getPastelColor(project.company_id || project.id, isDark)
  const companyName = project.companies?.name || 'Unknown Company'
  const companyLogo = project.companies?.logo_url
  const projectTypes = project.project_type || []

  return (
    <motion.div
      layoutId={`card-${layoutId}`}
      onClick={onClick}
      className="cursor-pointer group w-full"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      data-testid={`project-card-${project.id}`}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 bg-white dark:bg-neutral-900 p-4 flex flex-col border border-neutral-200 dark:border-neutral-800">
        {/* Pastel section - fully encapsulated with rounded corners */}
        <motion.div
          layoutId={`header-${layoutId}`}
          className="p-6 relative rounded-xl mb-4 flex-1 flex flex-col"
          style={{ background: pastelColor }}
        >
          {/* Date badge - top left with white pill background */}
          <div className="mb-6">
            <span className="text-xs text-neutral-700 dark:text-neutral-200 font-medium bg-white dark:bg-white/20 dark:backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 dark:border-white/10">
              {formatDate(project.updated_at)}
            </span>
          </div>

          {/* Company name, title, and logo row */}
          <div className="flex items-start gap-4 mb-6 py-4">
            {/* Left side: Company name and title */}
            <div className="flex-1 min-w-0 flex flex-col gap-2">
              {/* Company name */}
              <motion.div layoutId={`company-${layoutId}`}>
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                  {companyName}
                </p>
              </motion.div>

              {/* Project title */}
              <motion.h3
                layoutId={`title-${layoutId}`}
                className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2 break-words"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {project.title || 'Untitled Project'}
              </motion.h3>
            </div>

            {/* Right side: Company avatar */}
            <div className="flex-shrink-0">
              <motion.div layoutId={`avatar-${layoutId}`}>
                <Avatar className="h-12 w-12 ring-2 ring-white/20 dark:ring-white/10">
                  <AvatarImage src={companyLogo || ''} alt={companyName} />
                  <AvatarFallback className="bg-black text-white dark:bg-white dark:text-black font-bold text-lg">
                    {getCompanyInitials(companyName)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
            </div>
          </div>

          {/* Project type tags section - inside colored section */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {projectTypes.length > 0 ? (
              projectTypes.map((type) => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="rounded-full text-xs font-normal border-neutral-300 dark:border-neutral-300/40 bg-white/60 dark:bg-white/20 dark:backdrop-blur-sm text-neutral-700 dark:text-neutral-100"
                >
                  {type}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-neutral-700 dark:text-neutral-200">No project type</span>
            )}
          </div>
        </motion.div>

        {/* Footer section - outside colored section */}
        <div className="px-1 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex flex-col gap-0.5 text-sm">
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
              {formatTeamSize(project.min_students, project.max_students)}
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {formatMaxTeams(project.max_teams)}
            </div>
          </div>

          <Button
            size="sm"
            className="shrink-0 rounded-full bg-black hover:bg-neutral-800 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white dark:text-neutral-50 font-medium px-6 shadow-sm dark:shadow-md"
            data-testid={`view-details-btn-${project.id}`}
          >
            Details
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

