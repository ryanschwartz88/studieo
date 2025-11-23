"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ApplyModal } from "@/app/student/search/_components/ApplyModal"
import { StudentLimits } from "@/app/student/search/_components/types"

interface ApplyButtonProps {
  project: {
    id: string
    title: string | null
    min_students: number | null
    max_students: number | null
    custom_questions?: { id: string; question: string; required: boolean }[] | null
  }
  studentLimits: StudentLimits
  currentUser: {
    id: string
    name: string | null
    email: string
    school_name: string | null
  }
}

export function ApplyButton({ project, studentLimits, currentUser }: ApplyButtonProps) {
  const [showApplyModal, setShowApplyModal] = useState(false)

  return (
    <>
      <Button 
        onClick={() => setShowApplyModal(true)}
        data-testid="apply-button"
      >
        Apply
      </Button>

      {showApplyModal && (
        <ApplyModal
          project={project as any}
          studentLimits={studentLimits}
          currentUser={currentUser}
          onClose={() => setShowApplyModal(false)}
        />
      )}
    </>
  )
}
