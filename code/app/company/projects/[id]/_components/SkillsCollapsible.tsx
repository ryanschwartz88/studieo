'use client'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'

interface SkillsCollapsibleProps {
  skills: string[] | null
  collaborationStyle: string | null
  mentorship: string | null
  location?: string | null
}

export function SkillsCollapsible({ skills, collaborationStyle, mentorship, location }: SkillsCollapsibleProps) {
  const skillsList = skills || []
  const hasMoreThanSix = skillsList.length > 6

  return (
    <div className="space-y-3 text-sm">
      <Collapsible>
        <div className="flex flex-wrap gap-2">
          {skillsList.slice(0, 6).map((s) => (
            <Badge key={s} variant="secondary">{s}</Badge>
          ))}
        </div>
        {hasMoreThanSix && (
          <>
            <CollapsibleTrigger className="mt-2 inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors group">
              Show more
              <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="flex flex-wrap gap-2">
                {skillsList.slice(6).map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CollapsibleContent>
          </>
        )}
      </Collapsible>
      <div className="flex flex-wrap gap-3">
        {collaborationStyle && (
          <Badge variant="outline">{collaborationStyle}</Badge>
        )}
        {location && (
          <Badge variant="outline">{location}</Badge>
        )}
        {mentorship && (
          <Badge variant="outline">Mentorship: {mentorship}</Badge>
        )}
      </div>
    </div>
  )
}

