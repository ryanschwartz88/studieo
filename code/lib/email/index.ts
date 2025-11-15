'use server'

import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Base email sending function with error handling
export async function sendEmail(params: {
  to: string | string[]
  subject: string
  html: string
  from?: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: params.from || 'Studieo <noreply@studieo.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })

    if (error) {
      console.error('Resend email error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Helper function to get base URL
export async function getBaseUrl() {
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
}

