"use client"

import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bookmark } from "lucide-react"
import { Project } from "./types"
import { getPastelColor, formatDate, getCompanyInitials, formatTeamSize, formatMaxTeams } from "./utils"

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onBookmarkToggle: (projectId: string, e?: React.MouseEvent) => void
  layoutId: string
}

export function ProjectCard({ project, onClick, onBookmarkToggle, layoutId }: ProjectCardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pastelColor = getPastelColor(project.company_id || project.id, isDark)
  const companyName = project.companies?.name || 'Unknown Company'
  const companyLogo = project.companies?.logo_url
  const projectTypes = project.project_type || []
  const isSaved = project.is_saved || false

  return (
    <motion.div
      layoutId={`card-${layoutId}`}
      onClick={onClick}
      className="cursor-pointer group w-full h-full"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      data-testid={`project-card-${project.id}`}
    >
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 bg-white dark:bg-neutral-900 p-4 flex flex-col border border-neutral-200 dark:border-neutral-800 relative">
        {/* Pastel section */}
        <motion.div
          layoutId={`header-${layoutId}`}
          className="p-6 relative rounded-xl mb-4 flex-1 flex flex-col"
          style={{ background: pastelColor }}
        >
          {/* Date badge and bookmark inline */}
          <div className="mb-6 flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-700 dark:text-neutral-200 font-medium bg-white dark:bg-white/20 dark:backdrop-blur-sm px-3 py-1 rounded-full border border-white/20 dark:border-white/10">
              {formatDate(project.updated_at)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBookmarkToggle(project.id, e)
              }}
              className="p-2 rounded-full bg-white/80 dark:bg-white/20 dark:backdrop-blur-sm hover:bg-white dark:hover:bg-white/30 transition-colors"
              data-testid={`bookmark-btn-${project.id}`}
            >
              <Bookmark 
                className={`h-4 w-4 ${isSaved ? 'text-primary' : ''}`}
                fill={isSaved ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          {/* Company name, title, and logo row */}
          <div className="flex items-center gap-4 mb-6 flex-1 min-h-0">
            <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between min-h-[88px]">
              <div>
                <motion.div layoutId={`company-${layoutId}`}>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                    {companyName}
                  </p>
                </motion.div>
                <motion.h3
                  layoutId={`title-${layoutId}`}
                  className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 line-clamp-2 break-words mt-2"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '3rem',
                  }}
                >
                  {project.title || 'Untitled Project'}
                </motion.h3>
              </div>
            </div>

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

          {/* Project type tags */}
          <div className="flex flex-wrap gap-2 mt-auto flex-shrink-0 min-h-[28px]">
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

        {/* Footer section */}
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

