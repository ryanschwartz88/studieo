'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Users, Calendar, FileText, CheckCircle2, Clock, XCircle, Download, HelpCircle, FileQuestion } from 'lucide-react'
import { ApplicationActions } from './ApplicationActions'

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
  const getStatusConfig = (status: Application['status']) => {
    const configs = {
      PENDING: { icon: Clock, label: 'Draft', className: 'bg-gray-100 text-gray-700' },
      SUBMITTED: { icon: Clock, label: 'To Review', className: 'bg-blue-100 text-blue-700' },
      ACCEPTED: { icon: CheckCircle2, label: 'Accepted', className: 'bg-green-100 text-green-700' },
      REJECTED: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700' },
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Review the team's application and members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
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
          {/* Design Document */}
          {application.design_doc_url && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Design Document</h3>
                </div>
                <a
                  href={`/api/design-docs/${application.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">View Design Document</span>
                  <Download className="h-4 w-4 ml-2" />
                </a>
              </div>
            </>
          )}

          <Separator />
          {/* Custom Questions & Answers */}
          {hasAnswers && hasQuestions && (
            <>
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
                  <div
                    key={member.student_id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">
                            {member.users.name || 'Student'}
                          </p>
                          {member.is_lead && (
                            <Badge variant="default" className="text-xs">
                              Team Lead
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {member.users.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {getSchoolFromEmail(member.users.email)}
                        </p>
                        {profile?.grad_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Graduation: {new Date(profile.grad_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={inviteConfig.className}>
                        {inviteConfig.label}
                      </Badge>
                    </div>

                    {profile?.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {profile.description}
                      </p>
                    )}

                    {profile?.interests && profile.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {profile.interests.slice(0, 5).map((interest) => (
                          <Badge key={interest} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                        {profile.interests.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{profile.interests.length - 5}
                          </Badge>
                        )}
                      </div>
                    )}

                    {profile?.resume_url && (
                      <a
                        href={`/api/resumes/${member.student_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <Download className="h-3 w-3" />
                        View Resume
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>


          {/* Actions */}
          {application.status === 'SUBMITTED' && (
            <>
              <Separator />
              <ApplicationActions
                applicationId={application.id}
                projectId={projectId}
                onSuccess={() => onOpenChange(false)}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

