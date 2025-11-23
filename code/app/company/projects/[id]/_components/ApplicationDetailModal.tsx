'use client'

import { useState, useEffect, useTransition } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Users, Calendar, FileText, CheckCircle2, Clock, XCircle, Download, HelpCircle, FileQuestion, Maximize2, Minimize2, ExternalLink, Info } from 'lucide-react'
import { getDesignDocUrl, acceptApplication, rejectApplication } from '@/lib/actions/applications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { TeamMemberProfilePopover } from './TeamMemberProfilePopover'

type TeamMember = {
  student_id: string
  is_lead: boolean
  invite_status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  confirmed_at: string | null
  users: {
    name: string | null
    email: string
    student_profiles: {
      grad_date: string | null
      resume_url: string | null
      interests: string[] | null
      description: string | null
    } | null
  }
}

type CustomQuestion = {
  id: string
  question: string
  required: boolean
}

type Project = {
  custom_questions?: CustomQuestion[]
}

type Application = {
  id: string
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  created_at: string
  submitted_at: string | null
  design_doc_url: string | null
  answers?: { question_id: string; answer: string }[]
  team_members: TeamMember[]
  users: {
    name: string | null
    email: string
    student_profiles: {
      grad_date: string | null
    } | null
  }
}

interface ApplicationDetailModalProps {
  application: Application
  projectId: string
  project?: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationDetailModal({
  application,
  projectId,
  project,
  open,
  onOpenChange,
}: ApplicationDetailModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pdfFullscreen, setPdfFullscreen] = useState(false)
  const [designDocUrl, setDesignDocUrl] = useState<string | null>(null)
  const [loadingDocUrl, setLoadingDocUrl] = useState(false)

  // Fetch design doc URL when modal opens and design doc exists
  useEffect(() => {
    if (open && application.design_doc_url && !designDocUrl && !loadingDocUrl) {
      setLoadingDocUrl(true)
      getDesignDocUrl(application.id)
        .then((result) => {
          if (result.success && result.url) {
            setDesignDocUrl(result.url)
          } else {
            toast.error(result.error || 'Failed to load design document')
          }
        })
        .catch((error) => {
          console.error('Error fetching design doc URL:', error)
          toast.error('Failed to load design document')
        })
        .finally(() => {
          setLoadingDocUrl(false)
        })
    }
  }, [open, application.design_doc_url, application.id, designDocUrl, loadingDocUrl])

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptApplication(application.id)
      if (result.success) {
        toast.success('Application accepted! Team has been notified.')
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to accept application')
      }
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectApplication(application.id)
      if (result.success) {
        toast.success('Application rejected. Team has been notified.')
        router.refresh()
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to reject application')
      }
    })
  }

  const getStatusConfig = (status: Application['status']) => {
    const configs = {
      PENDING: { icon: Clock, label: 'Draft', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
      SUBMITTED: { icon: Clock, label: 'To Review', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
      ACCEPTED: { icon: CheckCircle2, label: 'Accepted', className: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
      REJECTED: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
    }
    return configs[status]
  }

  const getInviteStatusConfig = (status: TeamMember['invite_status']) => {
    const configs = {
      PENDING: { label: 'Pending', className: 'border-yellow-500 text-yellow-700' },
      ACCEPTED: { label: 'Confirmed', className: 'border-green-500 text-green-700' },
      DECLINED: { label: 'Declined', className: 'border-red-500 text-red-700' },
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  const getSchoolFromEmail = (email: string) => {
    const domain = email.split('@')[1]
    const schoolMap: Record<string, string> = {
      'stanford.edu': 'Stanford University',
      'berkeley.edu': 'UC Berkeley',
      'caltech.edu': 'Caltech',
    }
    return schoolMap[domain] || domain.split('.')[0]
  }

  const hasAnswers = application.answers && application.answers.length > 0
  const hasQuestions = project?.custom_questions && project.custom_questions.length > 0


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Review the team's application and members
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <div className="space-y-6">
          {/* Status & Timeline */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <Badge className={statusConfig.className}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Submitted</p>
              <p className="text-sm">
                {application.submitted_at
                  ? new Date(application.submitted_at).toLocaleDateString()
                  : new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Separator />
          {/* Team Members */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold text-lg">
                Team Members ({application.team_members.length})
              </h3>
            </div>

            <div className="space-y-3">
              {application.team_members.map((member) => {
                const inviteConfig = getInviteStatusConfig(member.invite_status)
                const profile = member.users.student_profiles

                return (
                  <TeamMemberProfilePopover
                    key={member.student_id}
                    studentId={member.student_id}
                    studentName={member.users.name}
                    studentEmail={member.users.email}
                  >
                    <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {member.users.name || 'Student'}
                          </p>
                          {member.is_lead ? (
                            <>
                            <Badge variant="default" className="text-xs">
                              Team Lead
                            </Badge>
                            <Info className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </>
                          ) : (
                            <Info className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.users.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getSchoolFromEmail(member.users.email)}
                        </p>
                      </div>
                      <Badge variant="outline" className={inviteConfig.className}>
                        {inviteConfig.label}
                      </Badge>
                    </div>

                    
                    
                    </div>
                  </TeamMemberProfilePopover>
                )
              })}
            </div>
          </div>

          <Separator />
          {/* Design Document */}
          {application.design_doc_url && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">Design Document</h3>
                  </div>
                  {designDocUrl ? (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={designDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled={loadingDocUrl}>
                      {loadingDocUrl ? 'Loading...' : 'View'}
                    </Button>
                  )}
                </div>

                {designDocUrl && (
                  <div className="relative mt-4">
                    <iframe
                      src={designDocUrl}
                      className={`w-full border rounded-lg h-[600px]`}
                      title="PDF Preview"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Custom Questions & Answers */}
          {hasQuestions && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileQuestion className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Screening Questions</h3>
                </div>
                
                <Accordion type="single" collapsible className="w-full">
                  {project.custom_questions?.map((question) => {
                    const answer = application.answers?.find(a => a.question_id === question.id)
                    
                    return (
                      <AccordionItem key={question.id} value={question.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-start gap-2">
                            <span className="flex-1">{question.question}</span>
                            {question.required && (
                              <Badge variant="secondary" className="text-xs">Required</Badge>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 rounded-lg bg-muted/50 border">
                            <p className="text-sm whitespace-pre-wrap">
                              {answer?.answer || <span className="text-muted-foreground italic">No answer provided</span>}
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </div>
            </>
          )}

        </div>
        </div>

        {application.status === 'SUBMITTED' && (
          <DialogFooter className="p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-row justify-between sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reject Application?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will notify all team members that their application was not selected.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReject}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isPending ? 'Rejecting...' : 'Reject Application'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleAccept}
              disabled={isPending}
              className="min-w-[100px]"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
