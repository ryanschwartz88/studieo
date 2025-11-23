'use client'

import { useState, useEffect } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getStudentDetails, getResumeUrl } from '@/lib/actions/students'
import { toast } from 'sonner'
import { Mail, Loader2, GraduationCap, Download, CalendarIcon, Info } from 'lucide-react'
import { format } from 'date-fns'

type StudentDetails = {
  id: string
  name: string | null
  email: string
  description: string | null
  grad_date: string | null
  interests: string[] | null
  resume_url: string | null
  school_name: string | null
}

interface TeamMemberProfilePopoverProps {
  studentId: string
  studentName: string | null
  studentEmail: string
  children: React.ReactNode
}

const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

export function TeamMemberProfilePopover({
  studentId,
  studentName,
  studentEmail,
  children,
}: TeamMemberProfilePopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [details, setDetails] = useState<StudentDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && !details && !isLoading) {
      setIsLoading(true)
      getStudentDetails(studentId)
        .then((result) => {
          setIsLoading(false)
          if (result.success && result.student) {
            setDetails(result.student as StudentDetails)
          } else {
            toast.error(result.error || 'Failed to load student details')
          }
        })
        .catch((error) => {
          setIsLoading(false)
          console.error('Error loading student details:', error)
          toast.error('An error occurred while loading student details')
        })
    }
  }, [isOpen, details, isLoading, studentId])

  const handleDownloadResume = async () => {
    if (!details?.resume_url) return

    try {
      const result = await getResumeUrl(studentId)
      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        toast.error('Failed to get resume URL')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="start" side="top">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : details ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 rounded-lg">
                <AvatarFallback className="rounded-lg text-xl">
                  {getInitials(details.name, details.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-lg truncate">{details.name || 'Student'}</h4>
                  {details.school_name && (
                    <Badge variant="outline" className="bg-muted/50 flex-shrink-0">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {details.school_name}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{details.email}</span>
                  </div>
                  {details.grad_date && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarIcon className="h-3 w-3 flex-shrink-0" />
                      <span>Graduating {format(new Date(details.grad_date), 'MMM yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {details.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {details.description}
                  </p>
                </div>
              </>
            )}

            {details.interests && details.interests.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1.5">
                    {details.interests.slice(0, 5).map((interest, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {details.interests.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{details.interests.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {details.resume_url && (
              <>
                <Separator />
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDownloadResume()
                  }}
                  className="text-sm text-primary hover:underline flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" />
                  View Resume
                </a>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Failed to load profile</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
