"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, BookmarkCheck } from "lucide-react"
import { toggleSaveProject } from "@/lib/actions/saved-projects"
import { toast } from "sonner"

interface BookmarkButtonProps {
  projectId: string
  initialSaved: boolean
}

export function BookmarkButton({ projectId, initialSaved }: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(initialSaved)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    // Optimistic update
    setIsSaved(!isSaved)

    startTransition(async () => {
      const result = await toggleSaveProject(projectId)
      if (result.success) {
        toast.success(result.saved ? 'Project saved' : 'Project unsaved')
      } else {
        // Revert on error
        setIsSaved(isSaved)
        toast.error(result.error || 'Failed to update bookmark')
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      data-testid="bookmark-button"
    >
      {isSaved ? (
        <BookmarkCheck className="h-4 w-4 text-primary" fill="currentColor" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
    </Button>
  )
}

