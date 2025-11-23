"use client"

import { useState, useTransition, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { X, Users, Upload, FileText, AlertCircle, Maximize2, Minimize2, FileQuestion } from "lucide-react"
import { createApplication } from "@/lib/actions/applications"
import { StudentSearchCombobox } from "./StudentSearchCombobox"
import { TeamMemberBadge } from "./TeamMemberBadge"
import { Project, StudentLimits } from "./types"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface ApplyModalProps {
  project: Project
  studentLimits: StudentLimits
  currentUser: {
    id: string
    name: string | null
    email: string
    school_name: string | null
  }
  onClose: () => void
}

type Student = {
  id: string
  name: string | null
  email: string
  school_name?: string | null
  isCurrentUser?: boolean
}

export function ApplyModal({ project, studentLimits, currentUser, onClose }: ApplyModalProps) {
  const router = useRouter()
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

  // Custom Answers
  const [answers, setAnswers] = useState<Record<string, string>>({})

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
    // Validation
    if (!studentLimits.canApply) {
      toast.error(studentLimits.errors.join('. '))
      return
    }
    
    if (!designDoc) {
      toast.error('Design document is required')
      return
    }
    
    const totalTeamSize = selectedMembers.length
    if (project.min_students && totalTeamSize < project.min_students) {
      toast.error(`Team must have at least ${project.min_students} members`)
      return
    }
    if (project.max_students && totalTeamSize > project.max_students) {
      toast.error(`Team cannot exceed ${project.max_students} members`)
      return
    }

    // Validate custom questions
    const missingRequired = project.custom_questions?.filter(q => q.required && !answers[q.id]?.trim())
    if (missingRequired && missingRequired.length > 0) {
      toast.error(`Please answer all required questions`)
      return
    }
    
    startTransition(async () => {
      // Filter out current user from team members (they're automatically the lead)
      const teamMemberIds = selectedMembers
        .filter(m => !m.isCurrentUser)
        .map(m => m.id)
      
      const formattedAnswers = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer
      }))

      const result = await createApplication(
        project.id,
        teamMemberIds,
        designDoc || undefined,
        formattedAnswers
      )
      
      if (result.success) {
        toast.success('Application created successfully!')
        onClose()
        router.push(`/student/projects/${project.id}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to create application')
      }
    })
  }

  const totalTeamSize = selectedMembers.length
  const minTeam = project.min_students || 1
  const maxTeam = project.max_students || 10

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogPortal>
        <DialogOverlay 
          className="z-[150] backdrop-blur-sm !bg-transparent" 
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        />
        <DialogContent 
          className="max-w-4xl max-h-[90vh] flex flex-col z-[200] p-0 overflow-hidden"
          onInteractOutside={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClose()
          }}
          onEscapeKeyDown={(e) => {
            e.stopPropagation()
            onClose()
          }}
        >
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>Apply to {project.title}</DialogTitle>
          <DialogDescription>
            Build your team and submit your application
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Separator />
          <div className="space-y-6 py-4">
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
              <Separator />

              {/* Custom Questions */}
              {project.custom_questions && project.custom_questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <Label className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4" />
                    Screening Questions
                  </Label>
                  <p className="text-xs text-muted-foreground">Please answer the following questions from the company</p>
                  
                  <div className="p-1">
                    <Accordion type="single" collapsible className="w-full">
                      {project.custom_questions.map((question) => (
                        <AccordionItem key={question.id} value={question.id}>
                          <AccordionTrigger className="text-left">
                            <div className="flex items-start gap-2">
                              <span className="flex-1">{question.question}</span>
                              {question.required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-1 pt-1">
                            <Textarea
                              value={answers[question.id] || ''}
                              onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                              placeholder="Type your answer here..."
                              required={question.required}
                              className="min-h-[100px]"
                              rows={4}
                            />
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              )}
              <Separator />

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
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
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
      </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

