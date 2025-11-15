'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
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
import { CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { acceptApplication, rejectApplication } from '@/lib/actions/applications'
import { useRouter } from 'next/navigation'

interface ApplicationActionsProps {
  applicationId: string
  projectId: string
  onSuccess?: () => void
}

export function ApplicationActions({
  applicationId,
  projectId,
  onSuccess,
}: ApplicationActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleAccept = () => {
    startTransition(async () => {
      const result = await acceptApplication(applicationId)
      if (result.success) {
        toast.success('Application accepted! Team has been notified.')
        router.refresh()
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to accept application')
      }
    })
  }

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectApplication(applicationId)
      if (result.success) {
        toast.success('Application rejected. Team has been notified.')
        router.refresh()
        onSuccess?.()
      } else {
        toast.error(result.error || 'Failed to reject application')
      }
    })
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={handleAccept}
        disabled={isPending}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        <CheckCircle2 className="h-4 w-4 mr-2" />
        {isPending ? 'Accepting...' : 'Accept Application'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            disabled={isPending}
            className="flex-1"
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
    </div>
  )
}

