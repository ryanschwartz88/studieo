"use client"

import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type TeamMember = {
  id: string
  name: string | null
  email: string
  school_name?: string | null
  isCurrentUser?: boolean
}

interface TeamMemberBadgeProps {
  member: TeamMember
  onRemove?: (id: string) => void
  removable?: boolean
}

export function TeamMemberBadge({ member, onRemove, removable = true }: TeamMemberBadgeProps) {
  const displayName = member.name || (member.email ? member.email.split('@')[0] : 'Unknown')
  const schoolName = member.school_name || (member.email ? member.email.split('@')[1] : 'Unknown')

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant={member.isCurrentUser ? "default" : "secondary"}
          className="pl-3 pr-1 py-1.5 gap-1 cursor-pointer"
        >
          <span>{displayName}</span>
          {member.isCurrentUser && (
            <span className="text-xs opacity-70">(You)</span>
          )}
          {removable && !member.isCurrentUser && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove(member.id)
              }}
              className="hover:bg-muted rounded-full p-0.5 ml-1"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-semibold">{member.name || 'No name'}</h4>
            <p className="text-xs text-muted-foreground mt-1">{schoolName || 'Unknown school'}</p>
          </div>
          {member.email && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

