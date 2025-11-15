'use server'

import { sendEmail, getBaseUrl } from './index'

// Email template wrapper for consistent styling
function emailTemplate(content: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Studieo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <tr>
                  <td style="padding: 40px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="color: #000; font-size: 28px; font-weight: 700; margin: 0;">Studieo</h1>
                    </div>
                    
                    <!-- Content -->
                    ${content}
                    
                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #e5e5e5; text-align: center;">
                      <p style="color: #737373; font-size: 14px; margin: 0;">
                        © ${new Date().getFullYear()} Studieo. All rights reserved.
                      </p>
                      <p style="color: #a3a3a3; font-size: 12px; margin: 8px 0 0 0;">
                        You received this email because you're part of the Studieo platform.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

// Button component for emails
function emailButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary') {
  const bgColor = variant === 'primary' ? '#000' : '#ffffff'
  const textColor = variant === 'primary' ? '#ffffff' : '#000'
  const borderColor = variant === 'secondary' ? '#e5e5e5' : 'transparent'
  
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${bgColor}; border: 1px solid ${borderColor};">
          <a href="${url}" style="display: inline-block; padding: 12px 24px; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Send team invite email
 * Sent when a team lead invites a student to join an application
 */
export async function sendTeamInvite(params: {
  toEmail: string
  toName: string
  inviterName: string
  projectTitle: string
  applicationId: string
}) {
  const baseUrl = await getBaseUrl()
  const applicationUrl = `${baseUrl}/applications/${params.applicationId}`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      You've been invited to join a team!
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      <strong>${params.inviterName}</strong> has invited you to join their team for the project:
    </p>
    <div style="background-color: #f5f5f5; border-left: 4px solid #000; padding: 16px; margin: 24px 0;">
      <p style="color: #000; font-size: 18px; font-weight: 600; margin: 0;">
        ${params.projectTitle}
      </p>
    </div>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      View the application details and decide whether you'd like to join the team.
    </p>
    ${emailButton('View Application', applicationUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      <strong>Note:</strong> The team lead may submit the application before you confirm. You'll be able to confirm your participation after submission.
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `You've been invited to join a team for ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send application submitted notification
 * Sent to all team members when the application is submitted
 */
export async function sendApplicationSubmitted(params: {
  toEmail: string
  toName: string
  projectTitle: string
  companyName: string
  applicationId: string
  teamLeadName: string
  isLead: boolean
  needsConfirmation: boolean
}) {
  const baseUrl = await getBaseUrl()
  const applicationUrl = `${baseUrl}/applications/${params.applicationId}`
  
  const confirmationText = params.needsConfirmation 
    ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Action Required
        </p>
        <p style="color: #78350f; font-size: 14px; line-height: 20px; margin: 0;">
          Please confirm your participation in this application. If you don't want to participate, you can decline and the application will be disbanded.
        </p>
      </div>
      ${emailButton('Confirm Participation', applicationUrl)}
    `
    : ''
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      ${params.isLead ? 'Application Submitted!' : 'Team Application Submitted'}
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      ${params.isLead 
        ? 'Your application has been successfully submitted!' 
        : `${params.teamLeadName} has submitted the team application.`
      }
    </p>
    <div style="background-color: #f5f5f5; border-left: 4px solid #000; padding: 16px; margin: 24px 0;">
      <p style="color: #737373; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        PROJECT
      </p>
      <p style="color: #000; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
        ${params.projectTitle}
      </p>
      <p style="color: #737373; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        COMPANY
      </p>
      <p style="color: #525252; font-size: 16px; margin: 0;">
        ${params.companyName}
      </p>
    </div>
    ${confirmationText}
    ${!params.needsConfirmation ? emailButton('View Application', applicationUrl, 'secondary') : ''}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      The company will review your application and you'll be notified of their decision.
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `Application submitted: ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send application accepted notification
 * Sent to all team members when the company accepts the application
 */
export async function sendApplicationAccepted(params: {
  toEmail: string
  toName: string
  projectTitle: string
  companyName: string
  contactName: string
  contactEmail: string
  contactRole: string
  applicationId: string
}) {
  const baseUrl = await getBaseUrl()
  const applicationUrl = `${baseUrl}/applications/${params.applicationId}`
  
  const content = `
    <h2 style="color: #16a34a; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      🎉 Congratulations! Your application was accepted!
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Great news! <strong>${params.companyName}</strong> has accepted your team's application for:
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
      <p style="color: #15803d; font-size: 18px; font-weight: 600; margin: 0;">
        ${params.projectTitle}
      </p>
    </div>
    
    <h3 style="color: #000; font-size: 18px; font-weight: 600; margin: 32px 0 16px 0;">
      Next Steps
    </h3>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Please reach out to your company contact to coordinate the project kickoff:
    </p>
    <div style="background-color: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
      <p style="color: #737373; font-size: 12px; font-weight: 600; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">
        Contact Person
      </p>
      <p style="color: #000; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
        ${params.contactName}
      </p>
      <p style="color: #525252; font-size: 14px; margin: 0 0 8px 0;">
        ${params.contactRole}
      </p>
      <p style="color: #737373; font-size: 14px; margin: 0;">
        <a href="mailto:${params.contactEmail}" style="color: #000; text-decoration: underline;">
          ${params.contactEmail}
        </a>
      </p>
    </div>
    ${emailButton('View Project Details', applicationUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      Best of luck with your project! We're excited to see what you'll build together.
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `🎉 Accepted: ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send application rejected notification
 * Sent to all team members when the company rejects the application
 */
export async function sendApplicationRejected(params: {
  toEmail: string
  toName: string
  projectTitle: string
  companyName: string
}) {
  const baseUrl = await getBaseUrl()
  const browseUrl = `${baseUrl}/student/search`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      Application Update
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Thank you for applying to <strong>${params.projectTitle}</strong> at ${params.companyName}.
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Unfortunately, your team's application was not selected for this project. This decision was based on the specific needs of the project and does not reflect on your team's capabilities.
    </p>
    <div style="background-color: #f5f5f5; border-left: 4px solid #737373; padding: 16px; margin: 24px 0;">
      <p style="color: #525252; font-size: 14px; line-height: 20px; margin: 0;">
        Don't be discouraged! There are many other exciting projects on Studieo waiting for talented students like you.
      </p>
    </div>
    ${emailButton('Browse More Projects', browseUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      Keep applying and best of luck with your next application!
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `Application update: ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send new application notification to company
 * Sent when a student team submits an application
 */
export async function sendNewApplication(params: {
  toEmail: string
  companyName: string
  projectTitle: string
  projectId: string
  teamLeadName: string
  teamSize: number
}) {
  const baseUrl = await getBaseUrl()
  const projectUrl = `${baseUrl}/projects/${params.projectId}`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      New Application Received
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.companyName} team,
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      A new team has applied to your project!
    </p>
    <div style="background-color: #f5f5f5; border-left: 4px solid #000; padding: 16px; margin: 24px 0;">
      <p style="color: #737373; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        PROJECT
      </p>
      <p style="color: #000; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">
        ${params.projectTitle}
      </p>
      <p style="color: #737373; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        TEAM LEAD
      </p>
      <p style="color: #525252; font-size: 16px; margin: 0 0 12px 0;">
        ${params.teamLeadName}
      </p>
      <p style="color: #737373; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        TEAM SIZE
      </p>
      <p style="color: #525252; font-size: 16px; margin: 0;">
        ${params.teamSize} ${params.teamSize === 1 ? 'student' : 'students'}
      </p>
    </div>
    ${emailButton('Review Application', projectUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      Review their application, including team member profiles and design document, to make your decision.
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `New application for ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send application disbanded notification
 * Sent to all team members when a member declines and the application is disbanded
 */
export async function sendApplicationDisbanded(params: {
  toEmail: string
  toName: string
  projectTitle: string
  declinedByName: string
  isDeclinedBy: boolean
}) {
  const baseUrl = await getBaseUrl()
  const browseUrl = `${baseUrl}/student/search`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      Application Disbanded
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      ${params.isDeclinedBy 
        ? `You have declined participation in the application for <strong>${params.projectTitle}</strong>. The application has been disbanded.`
        : `<strong>${params.declinedByName}</strong> has declined participation in your team application for <strong>${params.projectTitle}</strong>. The application has been disbanded.`
      }
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
      <p style="color: #991b1b; font-size: 14px; line-height: 20px; margin: 0;">
        When a team member declines, the entire application is cancelled. ${params.isDeclinedBy ? 'Your former teammates have been notified.' : 'You can start a new application with a different team.'}
      </p>
    </div>
    ${emailButton('Browse Projects', browseUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      ${params.isDeclinedBy 
        ? 'You can browse other projects that match your interests.'
        : 'Consider applying again with a new team configuration.'
      }
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `Application disbanded: ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send team member confirmed notification to team lead
 * Sent when a team member confirms their participation
 */
export async function sendTeamMemberConfirmed(params: {
  toEmail: string
  teamLeadName: string
  memberName: string
  projectTitle: string
  applicationId: string
}) {
  const baseUrl = await getBaseUrl()
  const applicationUrl = `${baseUrl}/applications/${params.applicationId}`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      Team Member Confirmed
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.teamLeadName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      <strong>${params.memberName}</strong> has confirmed their participation in your application for:
    </p>
    <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
      <p style="color: #15803d; font-size: 18px; font-weight: 600; margin: 0;">
        ${params.projectTitle}
      </p>
    </div>
    ${emailButton('View Application', applicationUrl, 'secondary')}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      Your team is one step closer to being ready! You'll be notified when all members have confirmed.
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `Team member confirmed for ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

/**
 * Send application withdrawn notification
 * Sent when a team lead withdraws a pending application
 */
export async function sendApplicationWithdrawn(params: {
  toEmail: string
  toName: string
  projectTitle: string
  teamLeadName: string
}) {
  const baseUrl = await getBaseUrl()
  const browseUrl = `${baseUrl}/student/search`
  
  const content = `
    <h2 style="color: #000; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
      Application Withdrawn
    </h2>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      Hi ${params.toName},
    </p>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      <strong>${params.teamLeadName}</strong> has withdrawn the application for:
    </p>
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0;">
      <p style="color: #991b1b; font-size: 18px; font-weight: 600; margin: 0;">
        ${params.projectTitle}
      </p>
    </div>
    <p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
      The application has been cancelled and removed from the system. You can continue browsing other projects or join a different team.
    </p>
    ${emailButton('Browse Projects', browseUrl)}
    <p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
      Keep exploring opportunities that match your interests!
    </p>
  `
  
  return await sendEmail({
    to: params.toEmail,
    subject: `Application withdrawn: ${params.projectTitle}`,
    html: emailTemplate(content),
  })
}

