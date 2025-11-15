'use client'

import { useState, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { FileText, Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { confirmTeamMembership, declineTeamMembership } from '@/lib/actions/team-members'
import { withdrawApplication } from '@/lib/actions/applications'
import { useRouter } from 'next/navigation'

type TeamMember = {
  student_id: string
  is_lead: boolean
  invite_status: 'PENDING' | 'ACCEPTED' | 'DECLINED'
  confirmed_at: string | null
  users: {
    name: string | null
    email: string
  } | null
}

type Application = {
  id: string
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  created_at: string
  submitted_at: string | null
  design_doc_url: string | null
  team_members: TeamMember[]
}

interface ApplicationViewSheetProps {
  application: Application
  currentUserId: string
  projectTitle: string
  trigger?: React.ReactNode
}

export function ApplicationViewSheet({
  application,
  currentUserId,
  projectTitle,
  trigger,
}: ApplicationViewSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentUserMember = application.team_members.find(m => m.student_id === currentUserId)
  const isLead = currentUserMember?.is_lead || false
  const needsConfirmation = 
    currentUserMember?.invite_status === 'PENDING' && 
    (application.status === 'SUBMITTED' || application.status === 'PENDING')
  
  const totalMembers = application.team_members.length
  const confirmedMembers = application.team_members.filter(m => m.invite_status === 'ACCEPTED').length

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await confirmTeamMembership(application.id)
      if (result.success) {
        toast.success('Participation confirmed!')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to confirm participation')
      }
    })
  }

  const handleDecline = () => {
    startTransition(async () => {
      const result = await declineTeamMembership(application.id)
      if (result.success) {
        toast.success('Application disbanded')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to decline participation')
      }
    })
  }

  const handleWithdraw = () => {
    startTransition(async () => {
      const result = await withdrawApplication(application.id)
      if (result.success) {
        toast.success('Application withdrawn')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to withdraw application')
      }
    })
  }

  const getStatusBadge = (status: Application['status']) => {
    const statusConfig = {
      PENDING: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      SUBMITTED: { label: 'Submitted', variant: 'default' as const, icon: Clock },
      ACCEPTED: { label: 'Accepted', variant: 'default' as const, icon: CheckCircle2 },
      REJECTED: { label: 'Rejected', variant: 'secondary' as const, icon: XCircle },
    }
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1.5">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getInviteStatusBadge = (status: TeamMember['invite_status'], confirmedAt: string | null) => {
    const statusConfig = {
      PENDING: { label: 'Pending Confirmation', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-700' },
      ACCEPTED: { label: 'Confirmed', variant: 'outline' as const, className: 'border-green-500 text-green-700' },
      DECLINED: { label: 'Declined', variant: 'outline' as const, className: 'border-red-500 text-red-700' },
    }
    const config = statusConfig[status]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
        {status === 'ACCEPTED' && confirmedAt && (
          <span className="ml-1 text-xs opacity-70">
            ({new Date(confirmedAt).toLocaleDateString()})
          </span>
        )}
      </Badge>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            View Application
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Application Details</SheetTitle>
          <SheetDescription>
            {projectTitle}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(application.status)}</div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">
                {application.status === 'PENDING' ? 'Created' : 'Submitted'}
              </p>
              <p className="text-sm mt-1">
                {application.submitted_at 
                  ? new Date(application.submitted_at).toLocaleDateString()
                  : new Date(application.created_at).toLocaleDateString()
                }
              </p>
            </div>
          </div>

          {/* Confirmation Alert for Team Members */}
          {needsConfirmation && !isLead && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-yellow-700 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-yellow-900">Action Required</h4>
                  <p className="text-sm text-yellow-800 mt-1">
                    {application.status === 'PENDING' 
                      ? 'You have been invited to join this application. Please confirm your participation or decline if you don\'t want to proceed. The application will auto-submit when all members confirm.'
                      : 'Your team lead has submitted this application. Please confirm your participation or decline if you don\'t want to proceed.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  disabled={isPending}
                  size="sm"
                  className="flex-1"
                >
                  {isPending ? 'Confirming...' : 'Confirm Participation'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={isPending}
                    >
                      Decline
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Decline & Disband Application?</AlertDialogTitle>
                      <AlertDialogDescription>
                        If you decline, the entire application will be disbanded and all team members will be notified. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDecline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {isPending ? 'Declining...' : 'Decline & Disband'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {/* Team Lead Status for PENDING Applications */}
          {application.status === 'PENDING' && isLead && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-blue-700 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900">Waiting for Team Confirmations</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    {confirmedMembers} of {totalMembers} team members have confirmed. The application will auto-submit when all members confirm their participation.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    disabled={isPending}
                  >
                    Withdraw Application
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your application and notify all team members. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWithdraw} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {isPending ? 'Withdrawing...' : 'Withdraw Application'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Team Members */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Team Members ({application.team_members.length})</p>
            </div>
            <div className="space-y-3">
              {application.team_members.map((member) => (
                <div
                  key={member.student_id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.users?.name || 'Student'}
                      </p>
                      {member.is_lead && (
                        <Badge variant="secondary" className="text-xs">Team Lead</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.users?.email || 'N/A'}</p>
                  </div>
                  <div>
                    {getInviteStatusBadge(member.invite_status, member.confirmed_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Design Document */}
          {application.design_doc_url && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Design Document</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={`/api/design-docs/${application.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Document
                </a>
              </Button>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Timeline</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(application.created_at).toLocaleString()}</span>
              </div>
              {application.submitted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted</span>
                  <span>{new Date(application.submitted_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

