'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { ApplicationDetailModal } from './ApplicationDetailModal'
import { useState } from 'react'

export type Application = {
  id: string
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
  created_at: string
  submitted_at: string | null
  design_doc_url: string | null
  answers?: { question_id: string; answer: string }[]
  team_members: {
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
  }[]
  users: {
    name: string | null
    email: string
    student_profiles: {
      grad_date: string | null
    } | null
  }
}

interface ApplicationCardProps {
  application: Application
  projectId: string
}

export function ApplicationCard({ application, projectId }: ApplicationCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const teamLead = application.team_members.find(m => m.is_lead)
  const teamLeadUser = application.users || teamLead?.users
  const teamSize = application.team_members.length

  const getStatusConfig = (status: Application['status']) => {
    const configs = {
      PENDING: { icon: Clock, label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-200' },
      SUBMITTED: { icon: Clock, label: 'To Review', className: 'bg-blue-100 text-blue-700 border-blue-200' },
      ACCEPTED: { icon: CheckCircle2, label: 'Accepted', className: 'bg-green-100 text-green-700 border-green-200' },
      REJECTED: { icon: XCircle, label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' },
    }
    return configs[status]
  }

  const statusConfig = getStatusConfig(application.status)
  const StatusIcon = statusConfig.icon

  // Get school name from email domain
  const getSchoolFromEmail = (email: string) => {
    const domain = email.split('@')[1]
    const schoolMap: Record<string, string> = {
      'stanford.edu': 'Stanford',
      'berkeley.edu': 'UC Berkeley',
      'caltech.edu': 'Caltech',
      // Add more mappings as needed
    }
    return schoolMap[domain] || domain.split('.')[0]
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{teamLeadUser?.name || 'Student'}</h3>
              <p className="text-sm text-muted-foreground">
                {teamLeadUser && getSchoolFromEmail(teamLeadUser.email)}
              </p>
            </div>
            <Badge variant="outline" className={statusConfig.className}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{teamSize} {teamSize === 1 ? 'member' : 'members'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Submitted {application.submitted_at 
                ? new Date(application.submitted_at).toLocaleDateString()
                : new Date(application.created_at).toLocaleDateString()
              }
            </span>
          </div>

          {teamSize > 1 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Team members:</p>
              <div className="flex flex-wrap gap-1">
                {application.team_members.slice(0, 3).map((member) => (
                  <Badge key={member.student_id} variant="secondary" className="text-xs">
                    {member.users.name || 'Student'}
                  </Badge>
                ))}
                {teamSize > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{teamSize - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setIsModalOpen(true)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>

      <ApplicationDetailModal
        application={application}
        projectId={projectId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}

