'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  sendTeamInvite,
  sendApplicationSubmitted,
  sendApplicationAccepted,
  sendApplicationRejected,
  sendNewApplication,
} from '@/lib/email/templates'

export async function checkStudentLimits(userId?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const targetUserId = userId || user?.id

  if (!targetUserId) {
    return {
      canApply: false,
      activeProjects: 0,
      activeApplications: 0,
      errors: ['Not authenticated']
    }
  }

  // Count active projects (ACCEPTED applications = student is working on project)
  const { count: activeProjectsCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('team_lead_id', targetUserId)
    .eq('status', 'ACCEPTED')

  // Count active applications (PENDING or SUBMITTED)
  const { count: activeApplicationsCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('team_lead_id', targetUserId)
    .in('status', ['PENDING', 'SUBMITTED'])

  const activeProjects = activeProjectsCount ?? 0
  const activeApplications = activeApplicationsCount ?? 0

  const errors: string[] = []

  if (activeProjects >= 3) {
    errors.push('You have reached the maximum of 3 active projects')
  }

  if (activeApplications >= 20) {
    errors.push('You have reached the maximum of 20 active applications')
  }

  return {
    canApply: errors.length === 0,
    activeProjects,
    activeApplications,
    errors
  }
}

export async function createApplication(
  projectId: string,
  teamMemberIds: string[],
  designDocFile?: File,
  answers?: { question_id: string; answer: string }[]
): Promise<{ success: boolean; error?: string; applicationId?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Check limits
  const limits = await checkStudentLimits(user.id)
  if (!limits.canApply) {
    return { success: false, error: limits.errors.join('. ') }
  }

  // Check if user already has an application for this project
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('project_id', projectId)
    .eq('team_lead_id', user.id)
    .single()

  if (existingApplication) {
    return { success: false, error: 'You have already applied to this project' }
  }

  // Fetch project details to validate team size
  const { data: project } = await supabase
    .from('projects')
    .select('min_students, max_students, title, company_id, companies(name)')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { success: false, error: 'Project not found' }
  }

  // Validate team size (team lead + team members)
  const totalTeamSize = 1 + teamMemberIds.length
  if (project.min_students && totalTeamSize < project.min_students) {
    return {
      success: false,
      error: `Team size must be at least ${project.min_students} members`
    }
  }
  if (project.max_students && totalTeamSize > project.max_students) {
    return {
      success: false,
      error: `Team size cannot exceed ${project.max_students} members`
    }
  }

  // Create application
  const { data: application, error: createError } = await supabase
    .from('applications')
    .insert({
      project_id: projectId,
      team_lead_id: user.id,
      status: 'PENDING',
      answers: answers || [],
    })
    .select('id')
    .single()

  if (createError || !application) {
    console.error('Create application error:', createError)
    return { success: false, error: createError?.message || 'Failed to create application' }
  }

  // Upload design doc if provided
  if (designDocFile) {
    const filePath = `${application.id}/design-doc.pdf`
    const { error: uploadError } = await supabase.storage
      .from('design_docs')
      .upload(filePath, designDocFile, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      // Delete the application if file upload fails
      await supabase.from('applications').delete().eq('id', application.id)
      return { success: false, error: `Failed to upload design document: ${uploadError.message}` }
    }

    // Update application with design doc URL
    const { error: updateError } = await supabase
      .from('applications')
      .update({ design_doc_url: `design_docs/${filePath}` })
      .eq('id', application.id)

    if (updateError) {
      console.error('Update application with design doc error:', updateError)
      // Clean up
      await supabase.storage.from('design_docs').remove([filePath])
      await supabase.from('applications').delete().eq('id', application.id)
      return { success: false, error: `Failed to update application with design document: ${updateError.message}` }
    }
  }

  // Get team lead info for emails
  const { data: teamLeadData } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .single()

  const teamLeadName = teamLeadData?.name || 'Team lead'

  // Insert team lead into team_members table
  const { error: leadError } = await supabase
    .from('team_members')
    .insert({
      application_id: application.id,
      student_id: user.id,
      is_lead: true,
      invite_status: 'ACCEPTED',
    })

  if (leadError) {
    // Clean up
    if (designDocFile) {
      await supabase.storage.from('design_docs').remove([`${application.id}/design-doc.pdf`])
    }
    await supabase.from('applications').delete().eq('id', application.id)
    return { success: false, error: 'Failed to add team lead to team members' }
  }

  // Create team member records and send invites
  if (teamMemberIds.length > 0) {
    const teamMemberRecords = teamMemberIds.map(studentId => ({
      application_id: application.id,
      student_id: studentId,
      invite_status: 'PENDING' as const,
      is_lead: false,
    }))

    const { error: teamError } = await supabase
      .from('team_members')
      .insert(teamMemberRecords)

    if (teamError) {
      // Clean up
      if (designDocFile) {
        await supabase.storage.from('design_docs').remove([`${application.id}/design-doc.pdf`])
      }
      await supabase.from('applications').delete().eq('id', application.id)
      return { success: false, error: 'Failed to add team members' }
    }

    // Get team member emails and send invites
    const { data: teamMembersData } = await supabase
      .from('users')
      .select('email, name')
      .in('id', teamMemberIds)

    if (teamMembersData) {
      // Send invite emails (don't block on email sending)
      Promise.all(
        teamMembersData.map(member =>
          sendTeamInvite({
            toEmail: member.email,
            toName: member.name || 'Student',
            inviterName: teamLeadName,
            projectTitle: project.title,
            applicationId: application.id,
          })
        )
      ).catch(error => {
        console.error('Failed to send team invite emails:', error)
      })
    }
  } else {
    // Solo application (team lead only) - auto-submit immediately
    const submitResult = await submitApplication(application.id, true) // true = isAutoSubmit
    if (!submitResult.success) {
      return { success: false, error: submitResult.error || 'Failed to auto-submit solo application' }
    }
  }

  revalidatePath('/student/search')
  revalidatePath('/student/dashboard')
  return { success: true, applicationId: application.id }
}

export async function submitApplication(applicationId: string, isAutoSubmit: boolean = false) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Fetch application details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      team_lead_id,
      status,
      project_id,
      projects(
        title,
        access_type,
        max_teams,
        contact_name,
        contact_email,
        contact_role,
        company_id,
        companies(name, domain)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    return { success: false, error: 'Application not found' }
  }

  // Verify user is team lead (unless it's an auto-submit after all members confirmed)
  if (!isAutoSubmit && application.team_lead_id !== user.id) {
    return { success: false, error: 'Only the team lead can submit the application' }
  }

  if (!isAutoSubmit && application.status !== 'PENDING') {
    return { success: false, error: 'Application has already been submitted' }
  }

  const project = application.projects as any
  const company = project?.companies as any

  if (isAutoSubmit) {
    const { data: autoSubmitResult, error: autoSubmitError } = await supabase.rpc('auto_submit_application', {
      p_application_id: applicationId,
    })

    if (autoSubmitError) {
      return { success: false, error: autoSubmitError.message }
    }

    if (!autoSubmitResult) {
      return { success: false, error: 'All team members must confirm before submitting' }
    }
  } else {
    // Update application status to SUBMITTED
    const { error } = await supabase
      .from('applications')
      .update({
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  // Get all team members for email notifications
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select(`
      student_id,
      is_lead,
      invite_status,
      users(name, email)
    `)
    .eq('application_id', applicationId)

  const teamMembers = teamMembersData || []

  // Get team lead info
  const { data: teamLeadData } = await supabase
    .from('users')
    .select('name')
    .eq('id', application.team_lead_id)
    .single()

  const teamLeadName = teamLeadData?.name || 'Team lead'

  // Send submission emails to all team members
  if (teamMembers.length > 0) {
    Promise.all(
      teamMembers.map(member => {
        const memberUser = member.users as any
        return sendApplicationSubmitted({
          toEmail: memberUser.email,
          toName: memberUser.name || 'Student',
          projectTitle: project.title,
          companyName: company.name,
          applicationId,
          teamLeadName,
          isLead: member.is_lead,
          needsConfirmation: member.invite_status === 'PENDING',
        })
      })
    ).catch(error => {
      console.error('Failed to send application submitted emails:', error)
    })
  }

  // Handle OPEN projects by auto-deciding based on capacity
  if (project.access_type === 'OPEN') {
    const { data: autoDecision, error: autoDecisionError } = await supabase.rpc('auto_decide_open_application', {
      p_application_id: applicationId,
    })

    if (autoDecisionError) {
      console.error('Failed to auto decide OPEN project application:', autoDecisionError.message)
      return { success: false, error: 'Unable to finalize the application decision. Please try again.' }
    }

    if (autoDecision === 'ACCEPTED') {
      // Send acceptance emails to all team members
      if (teamMembers.length > 0) {
        Promise.all(
          teamMembers.map(member => {
            const memberUser = member.users as any
            return sendApplicationAccepted({
              toEmail: memberUser.email,
              toName: memberUser.name || 'Student',
              projectTitle: project.title,
              companyName: company.name,
              contactName: project.contact_name,
              contactEmail: project.contact_email,
              contactRole: project.contact_role,
              applicationId,
            })
          })
        ).catch(error => {
          console.error('Failed to send acceptance emails for OPEN project:', error)
        })
      }

      revalidatePath('/student/search')
      revalidatePath('/student/dashboard')
      revalidatePath('/student/projects')
      revalidatePath(`/student/projects/${application.project_id}`)
      revalidatePath('/student', 'layout')
      revalidatePath('/company/dashboard')
      revalidatePath(`/company/projects/${application.project_id}`)
      return { success: true, autoApproved: true }
    }

    if (autoDecision === 'REJECTED') {
      if (teamMembers.length > 0) {
        Promise.all(
          teamMembers.map(member => {
            const memberUser = member.users as any
            return sendApplicationRejected({
              toEmail: memberUser.email,
              toName: memberUser.name || 'Student',
              projectTitle: project.title,
              companyName: company.name,
            })
          })
        ).catch(error => {
          console.error('Failed to send rejection emails for OPEN project:', error)
        })
      }

      revalidatePath('/student/search')
      revalidatePath('/student/dashboard')
      return {
        success: false,
        error: 'This project is at capacity and automatically rejected your team.',
      }
    }
  } else {
    // CLOSED project - notify company
    // Get company contact email
    // Get company contact email
    const { data: projectData } = await supabase
      .from('projects')
      .select('created_by_id')
      .eq('id', application.project_id)
      .single()

    if (projectData?.created_by_id) {
      const { data: creatorUser } = await supabase
        .from('users')
        .select('email')
        .eq('id', projectData.created_by_id)
        .single()

      if (creatorUser?.email) {
        sendNewApplication({
          toEmail: creatorUser.email,
          companyName: company.name,
          projectTitle: project.title,
          projectId: application.project_id,
          teamLeadName,
          teamSize: teamMembers.length,
        }).catch(error => {
          console.error('Failed to send new application email to company:', error)
        })
      }
    }
  }

  revalidatePath('/student/search')
  revalidatePath('/student/dashboard')
  revalidatePath('/student', 'layout')
  revalidatePath('/company/dashboard')
  return { success: true, autoApproved: false }
}

export async function withdrawApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify user is team lead
  const { data: application } = await supabase
    .from('applications')
    .select(`
      team_lead_id,
      status,
      project_id,
      projects(title),
      team_members(student_id, users(name, email))
    `)
    .eq('id', applicationId)
    .single()

  if (!application || application.team_lead_id !== user.id) {
    return { success: false, error: 'Application not found or access denied' }
  }

  if (application.status !== 'PENDING') {
    return { success: false, error: 'Can only withdraw PENDING applications' }
  }

  // Get design doc path before deleting
  const { data: appData } = await supabase
    .from('applications')
    .select('design_doc_url')
    .eq('id', applicationId)
    .single()

  // Delete the application (cascade will delete team_members)
  const { error: deleteError } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // Delete design doc from storage if exists
  if (appData?.design_doc_url) {
    const filePath = appData.design_doc_url.replace('design_docs/', '')
    await supabase.storage
      .from('design_docs')
      .remove([filePath])
      .catch(error => {
        console.error('Failed to delete design doc:', error)
      })
  }

  // Send notification emails to team members
  const project = application.projects as any
  const teamMembers = application.team_members as any[]

  if (teamMembers && teamMembers.length > 0) {
    const { data: teamLeadData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single()

    const teamLeadName = teamLeadData?.name || 'Team lead'

    // Import and send withdrawal emails
    const { sendApplicationWithdrawn } = await import('@/lib/email/templates')

    Promise.all(
      teamMembers
        .filter(member => member.student_id !== user.id) // Don't email the lead
        .map(member => {
          const memberUser = member.users as any
          return sendApplicationWithdrawn({
            toEmail: memberUser.email,
            toName: memberUser.name || 'Student',
            projectTitle: project.title,
            teamLeadName,
          }).catch(error => {
            console.error('Failed to send withdrawal email:', error)
          })
        })
    )
  }

  revalidatePath('/student/search')
  revalidatePath('/student/dashboard')
  return { success: true }
}

export async function acceptApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get application and project details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      project_id,
      projects(
        title,
        company_id,
        contact_name,
        contact_email,
        contact_role,
        companies(name)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    return { success: false, error: 'Application not found' }
  }

  const project = application.projects as any
  const company = project?.companies as any

  // Verify user is from the company
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'COMPANY' || userData?.company_id !== project.company_id) {
    return { success: false, error: 'Only company members can accept applications' }
  }

  if (application.status !== 'SUBMITTED') {
    return { success: false, error: 'Only submitted applications can be accepted' }
  }

  // Update application status
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'ACCEPTED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Get all team members
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('student_id, users(name, email)')
    .eq('application_id', applicationId)

  const teamMembers = teamMembersData || []

  // Send acceptance emails to all team members
  if (teamMembers.length > 0) {
    Promise.all(
      teamMembers.map(member => {
        const memberUser = member.users as any
        if (!memberUser?.email) return Promise.resolve()

        return sendApplicationAccepted({
          toEmail: memberUser.email,
          toName: memberUser.name || 'Student',
          projectTitle: project.title,
          companyName: company.name,
          contactName: project.contact_name || 'Company Contact',
          contactEmail: project.contact_email || '',
          contactRole: project.contact_role || 'Representative',
          applicationId,
        })
      })
    ).catch(error => {
      console.error('Failed to send acceptance emails:', error)
    })
  }

  revalidatePath('/company/dashboard')
  revalidatePath(`/company/projects/${application.project_id}`)
  revalidatePath('/student/dashboard')
  revalidatePath('/student/projects')
  revalidatePath(`/student/projects/${application.project_id}`)
  revalidatePath('/student', 'layout')
  return { success: true }
}

export async function rejectApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get application and project details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      project_id,
      projects(
        title,
        company_id,
        companies(name)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    return { success: false, error: 'Application not found' }
  }

  const project = application.projects as any
  const company = project?.companies as any

  // Verify user is from the company
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'COMPANY' || userData?.company_id !== project.company_id) {
    return { success: false, error: 'Only company members can reject applications' }
  }

  if (application.status !== 'SUBMITTED') {
    return { success: false, error: 'Only submitted applications can be rejected' }
  }

  // Update application status
  const { error } = await supabase
    .from('applications')
    .update({
      status: 'REJECTED',
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Get all team members
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('student_id, users(name, email)')
    .eq('application_id', applicationId)

  const teamMembers = teamMembersData || []

  // Send rejection emails to all team members
  if (teamMembers.length > 0) {
    Promise.all(
      teamMembers.map(member => {
        const memberUser = member.users as any
        if (!memberUser?.email) return Promise.resolve()

        return sendApplicationRejected({
          toEmail: memberUser.email,
          toName: memberUser.name || 'Student',
          projectTitle: project.title,
          companyName: company.name,
        })
      })
    ).catch(error => {
      console.error('Failed to send rejection emails:', error)
    })
  }

  revalidatePath('/company/dashboard')
  revalidatePath(`/company/projects/${application.project_id}`)
  revalidatePath('/student/dashboard')
  return { success: true }
}

export async function getDesignDocUrl(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the application to check access and get design_doc_url
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('design_doc_url, team_lead_id, project_id, team_members(student_id)')
    .eq('id', applicationId)
    .single()

  if (appError || !application) {
    return { success: false, error: 'Application not found' }
  }

  // Check if user has access (team lead or team member)
  const isTeamLead = application.team_lead_id === user.id
  const isTeamMember = application.team_members?.some((tm: any) => tm.student_id === user.id)

  // Check if company user has access (project belongs to user's company)
  let isCompanyUser = false
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role === 'COMPANY') {
    const { data: project } = await supabase
      .from('projects')
      .select('company_id')
      .eq('id', application.project_id)
      .single()

    isCompanyUser = project?.company_id === userData.company_id
  }

  if (!isTeamLead && !isTeamMember && !isCompanyUser) {
    return { success: false, error: 'Access denied' }
  }

  if (!application.design_doc_url) {
    return { success: false, error: 'Design document not found' }
  }

  // Extract the file path from design_doc_url (format: design_docs/{application_id}/design-doc.pdf)
  const filePath = application.design_doc_url.replace('design_docs/', '')

  // Generate signed URL (valid for 1 hour)
  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from('design_docs')
    .createSignedUrl(filePath, 3600)

  if (urlError || !signedUrlData) {
    return { success: false, error: 'Failed to generate document URL' }
  }

  return { success: true, url: signedUrlData.signedUrl }
}

export async function deleteApplication(applicationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get application and project details
  const { data: application } = await supabase
    .from('applications')
    .select(`
      id,
      project_id,
      design_doc_url,
      projects(
        title,
        company_id,
        companies(name)
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!application) {
    return { success: false, error: 'Application not found' }
  }

  const project = application.projects as any
  const company = project?.companies as any

  // Verify user is from the company
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'COMPANY' || userData?.company_id !== project.company_id) {
    return { success: false, error: 'Only company members can delete applications' }
  }

  // Get design doc path before deleting
  const designDocUrl = application.design_doc_url

  // Delete the application (cascade will delete team_members)
  const { error: deleteError } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // Delete design doc from storage if exists
  if (designDocUrl) {
    const filePath = designDocUrl.replace('design_docs/', '')
    await supabase.storage
      .from('design_docs')
      .remove([filePath])
      .catch(error => {
        console.error('Failed to delete design doc:', error)
      })
  }

  // We could send emails here, but deletion usually implies removal without notification or "hard delete".
  // If the user wants to reject, they should use reject. Delete is for cleanup.

  revalidatePath('/company/dashboard')
  revalidatePath(`/company/projects/${application.project_id}`)
  revalidatePath('/student/dashboard')

  return { success: true }
}
