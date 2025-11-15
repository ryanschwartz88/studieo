'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendApplicationDisbanded,
  sendTeamMemberConfirmed,
} from '@/lib/email/templates'

/**
 * Confirm team membership
 * Student confirms their participation in the application after submission
 */
export async function confirmTeamMembership(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get team member record
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, invite_status, application_id')
    .eq('application_id', applicationId)
    .eq('student_id', user.id)
    .single()

  if (!teamMember) {
    return { success: false, error: 'You are not a member of this application' }
  }

  if (teamMember.invite_status === 'ACCEPTED') {
    return { success: false, error: 'You have already confirmed your participation' }
  }

  // Update team member status
  const { error } = await supabase
    .from('team_members')
    .update({
      invite_status: 'ACCEPTED',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', teamMember.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Check if all team members have confirmed
  const { data: allMembers } = await supabase
    .from('team_members')
    .select('invite_status')
    .eq('application_id', applicationId)

  if (allMembers) {
    const allConfirmed = allMembers.every(member => member.invite_status === 'ACCEPTED')
    
    if (allConfirmed) {
      // All team members have confirmed, auto-submit the application
      const { submitApplication } = await import('./applications')
      const submitResult = await submitApplication(applicationId)
      
      if (!submitResult.success) {
        console.error('Failed to auto-submit application:', submitResult.error)
        // Don't fail the confirmation - just log the error
      }
    }
  }

  // Get application and project details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      team_lead_id,
      projects(title)
    `)
    .eq('id', applicationId)
    .single()

  if (application) {
    const project = application.projects as any
    
    // Get team lead email to notify
    const { data: teamLeadData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', application.team_lead_id)
      .single()

    // Get current user name
    const { data: currentUserData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    if (teamLeadData && currentUserData) {
      // Send confirmation email to team lead
      sendTeamMemberConfirmed({
        toEmail: teamLeadData.email,
        teamLeadName: teamLeadData.name || 'Team lead',
        memberName: currentUserData.name || 'A team member',
        projectTitle: project.title,
        applicationId,
      }).catch(error => {
        console.error('Failed to send team member confirmed email:', error)
      })
    }
  }

  revalidatePath(`/student/search/projects`)
  revalidatePath('/student/dashboard')
  return { success: true }
}

/**
 * Decline team membership and disband the application
 * When any team member declines, the entire application is disbanded
 */
export async function declineTeamMembership(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user is a member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('application_id', applicationId)
    .eq('student_id', user.id)
    .single()

  if (!teamMember) {
    return { success: false, error: 'You are not a member of this application' }
  }

  // Use the database function to disband the application
  const { data: result, error } = await supabase
    .rpc('disband_application', {
      p_application_id: applicationId,
      p_student_id: user.id,
    })

  if (error) {
    return { success: false, error: error.message }
  }

  const disbandResult = result as any

  if (!disbandResult.success) {
    return { success: false, error: disbandResult.error || 'Failed to disband application' }
  }

  // Get project info and current user name
  const { data: application } = await supabase
    .from('applications')
    .select('projects(title)')
    .eq('id', applicationId)
    .single()

  const { data: currentUserData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const project = application?.projects as any
  const currentUserName = currentUserData?.name || 'A team member'

  // Send disbanding emails to all team members
  if (disbandResult.team_members && project) {
    const teamMembers = disbandResult.team_members as any[]
    
    Promise.all(
      teamMembers.map(member =>
        sendApplicationDisbanded({
          toEmail: member.email,
          toName: member.name || 'Student',
          projectTitle: project.title,
          declinedByName: currentUserName,
          isDeclinedBy: member.student_id === user.id,
        })
      )
    ).catch(error => {
      console.error('Failed to send application disbanded emails:', error)
    })
  }

  revalidatePath('/student/search')
  revalidatePath('/student/dashboard')
  return { success: true }
}

