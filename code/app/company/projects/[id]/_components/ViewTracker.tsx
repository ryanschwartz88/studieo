"use client"

import { useEffect } from "react"
import { recordProjectView } from "@/lib/actions/projects"

interface ViewTrackerProps {
  projectId: string
}

/**
 * Client component that tracks project views on mount
 * Silently records the view without blocking UI
 */
export function ViewTracker({ projectId }: ViewTrackerProps) {
  useEffect(() => {
    // Track view on mount
    const trackView = async () => {
      try {
        await recordProjectView(projectId)
      } catch (error) {
        // Fail silently - view tracking shouldn't break the page
        console.error('Failed to track project view:', error)
      }
    }
    
    trackView()
  }, [projectId])

  // This component doesn't render anything
  return null
}

