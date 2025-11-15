"use client"

import { forwardRef, useState, useTransition, useEffect } from "react"
import { useTheme } from "next-themes"
import { motion } from "motion/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Users, Building2, Calendar, Clock, Lock, MapPin, Link as LinkIcon, FileText, ExternalLink, Bookmark, Upload, AlertCircle, ArrowLeft, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ResourceLinks } from "@/app/company/projects/[id]/_components/ResourceLinks"
import { ResourceFiles } from "@/app/company/projects/[id]/_components/ResourceFiles"
import { Project, StudentLimits } from "./types"
import { getPastelColor, formatDate, getCompanyInitials, formatTeamSize, formatMaxTeams } from "./utils"
import { createApplication } from "@/lib/actions/applications"
import { toast } from "sonner"
import { StudentSearchCombobox } from "./StudentSearchCombobox"
import { TeamMemberBadge } from "./TeamMemberBadge"

interface ProjectModalProps {
  project: Project
  onClose: () => void
  onBookmarkToggle: (projectId: string) => void
  studentLimits: StudentLimits
  currentUser: {
    id: string
    name: string | null
    email: string
    school_name: string | null
  }
  layoutId: string
}

type Student = {
  id: string
  name: string | null
  email: string
  school_name?: string | null
  isCurrentUser?: boolean
}

export const ProjectModal = forwardRef<HTMLDivElement, ProjectModalProps>(
  ({ project, onClose, onBookmarkToggle, studentLimits, currentUser, layoutId }, ref) => {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const pastelColor = getPastelColor(project.company_id || project.id, isDark)
  const companyName = project.companies?.name || 'Unknown Company'
  const companyLogo = project.companies?.logo_url
  const skills = project.skills_needed || []
  const isSaved = project.is_saved || false

  const [showApplyForm, setShowApplyForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  // Team member selection - initialize with current user
  const [selectedMembers, setSelectedMembers] = useState<Student[]>([
    {
      ...currentUser,
      isCurrentUser: true
    }
  ])
  
  // PDF upload
  const [designDoc, setDesignDoc] = useState<File | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [pdfFullscreen, setPdfFullscreen] = useState(false)

  const handleAddMember = (student: Student) => {
    setSelectedMembers([...selectedMembers, { ...student, isCurrentUser: false }])
  }

  const handleRemoveMember = (studentId: string) => {
    // Don't allow removing current user
    if (studentId === currentUser.id) return
    setSelectedMembers(selectedMembers.filter(m => m.id !== studentId))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('File size must be under 10MB')
      return
    }
    
    setDesignDoc(file)
    
    // Create preview URL
    const url = URL.createObjectURL(file)
    setPdfPreviewUrl(url)
  }

  const handleRemoveFile = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl)
    }
    setDesignDoc(null)
    setPdfPreviewUrl(null)
  }

  const handleSubmit = async () => {
    // Check limits
    if (!studentLimits.canApply) {
      toast.error(studentLimits.errors.join('. '))
      return
    }
    
    // Validate design document
    if (!designDoc) {
      toast.error('Design document is required')
      return
    }
    
    // Validate team size
    const totalTeamSize = 1 + selectedMembers.length
    const minTeam = project.min_students || 1
    const maxTeam = project.max_students || 10
    
    if (totalTeamSize < minTeam) {
      toast.error(`Team must have at least ${minTeam} members`)
      return
    }
    if (totalTeamSize > maxTeam) {
      toast.error(`Team cannot exceed ${maxTeam} members`)
      return
    }
    
    startTransition(async () => {
      const result = await createApplication(
        project.id,
        selectedMembers.map(m => m.id),
        designDoc || undefined
      )
      
      if (result.success) {
        toast.success('Application created successfully!')
        onClose()
        router.push(`/applications/${result.applicationId}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create application')
      }
    })
  }

  const totalTeamSize = 1 + selectedMembers.length
  const minTeam = project.min_students || 1
  const maxTeam = project.max_students || 10

  return (
    <>
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


            {/* Bookmark button (only shown in project view) */}
            {!showApplyForm && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBookmarkToggle(project.id)
              }}
              className="absolute top-4 right-16 z-10 flex items-center justify-center bg-white dark:bg-neutral-800 rounded-full h-8 w-8 shadow-md hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              data-testid="modal-bookmark-btn"
            >
              <Bookmark 
                className={`h-4 w-4 ${isSaved ? 'text-primary' : ''}`}
                fill={isSaved ? 'currentColor' : 'none'}
              />
            </button>
            )}

            {!showApplyForm ? (
              <>
            {/* Hero section with pastel background */}
            <motion.div
              layoutId={`header-${layoutId}`}
                  className="p-8 relative flex-shrink-0"
              style={{ backgroundColor: pastelColor }}
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
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-6">
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
                          {/* Only show location if it's different from collaboration_style (avoid double "Remote") */}
                          {project.location && 
                           project.location.toLowerCase() !== project.collaboration_style?.toLowerCase() && (
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
                </ScrollArea>

            {/* Footer CTA */}
                <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-center gap-3 flex-shrink-0">
              <Button 
                variant="outline" 
                className="rounded-full px-6" 
                asChild
                data-testid={`view-full-project-btn-${project.id}`}
              >
                <Link href={`/student/search/projects/${project.id}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Full Project
                </Link>
              </Button>
              <Button 
                className="rounded-full px-8" 
                    onClick={() => setShowApplyForm(true)}
                data-testid={`apply-btn-${project.id}`}
              >
                Apply
              </Button>
            </div>
              </>
            ) : (
              <>
                {/* Apply Form Header */}
                <div className="px-6 pt-6 pb-4 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                  {/* Back button above title */}
                  <button
                    onClick={() => {
                      setShowApplyForm(false)
                      // Reset form state
                      setSelectedMembers([])
                      setDesignDoc(null)
                      if (pdfPreviewUrl) {
                        URL.revokeObjectURL(pdfPreviewUrl)
                        setPdfPreviewUrl(null)
                      }
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                    data-testid="modal-back-btn"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to project</span>
                  </button>
                  
                  <div>
                    <h2 className="text-xl font-bold">Apply to {project.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Build your team and submit your application
                    </p>
                  </div>
                </div>

                {/* Apply Form Content */}
                <ScrollArea className="flex-1 px-6 overflow-y-auto">
                  <div className="py-6 space-y-6">
                    {/* Limits warning */}
                    {!studentLimits.canApply && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-destructive">Cannot apply</p>
                          <p className="text-xs text-destructive/80 mt-1">{studentLimits.errors.join('. ')}</p>
                        </div>
                      </div>
                    )}

                    {/* Team member search */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Team Members
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {totalTeamSize} / {maxTeam} members
                        </span>
                      </div>
                      
                      <StudentSearchCombobox
                        selectedStudents={selectedMembers}
                        onSelect={handleAddMember}
                        disabled={isPending}
                      />

                      {/* Selected members - always shown with current user */}
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Your team:</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedMembers.map((member) => (
                            <TeamMemberBadge
                              key={member.id}
                              member={member}
                              onRemove={handleRemoveMember}
                              removable={!member.isCurrentUser}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Team size validation */}
                      {totalTeamSize < minTeam && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          You need at least {minTeam - totalTeamSize} more member(s)
                        </p>
                      )}
                      {totalTeamSize > maxTeam && (
                        <p className="text-xs text-destructive">
                          Team size exceeds maximum of {maxTeam} members
                        </p>
                      )}
                    </div>

                    {/* PDF upload */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Design Document <span className="text-destructive">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">Required to submit your application</p>
                      
                      {!designDoc ? (
                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Input
                            id="design-doc"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isPending}
                          />
                          <label htmlFor="design-doc" className="cursor-pointer">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Upload Design Document</p>
                            <p className="text-xs text-muted-foreground mt-1">PDF up to 10MB (Required)</p>
                          </label>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{designDoc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(designDoc.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleRemoveFile}
                              disabled={isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* PDF Preview */}
                          {pdfPreviewUrl && (
                            <div className="relative">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground">Preview</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPdfFullscreen(!pdfFullscreen)}
                                  className="h-7 text-xs"
                                >
                                  {pdfFullscreen ? (
                                    <>
                                      <Minimize2 className="h-3 w-3 mr-1" />
                                      Exit Fullscreen
                                    </>
                                  ) : (
                                    <>
                                      <Maximize2 className="h-3 w-3 mr-1" />
                                      Fullscreen
                                    </>
                                  )}
                                </Button>
                              </div>
                              <iframe
                                src={pdfPreviewUrl}
                                className={`w-full border rounded-lg ${pdfFullscreen ? 'h-[70vh]' : 'h-[500px]'}`}
                                title="PDF Preview"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Apply Form Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowApplyForm(false)
                      // Reset form state
                      setSelectedMembers([])
                      setDesignDoc(null)
                      if (pdfPreviewUrl) {
                        URL.revokeObjectURL(pdfPreviewUrl)
                        setPdfPreviewUrl(null)
                      }
                    }} 
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isPending ||
                      !studentLimits.canApply ||
                      totalTeamSize < minTeam ||
                      totalTeamSize > maxTeam ||
                      !designDoc
                    }
                    data-testid="submit-application-btn"
                  >
                    Submit Application
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  )
})

ProjectModal.displayName = "ProjectModal"

