/**
/**
 * Script to generate Supabase Auth email templates
 * Run this to get the HTML templates to paste into Supabase Dashboard
 * 
 * Usage: npx tsx lib/email/generate-supabase-templates.ts
 */

import fs from 'fs'
import path from 'path'

// Email template wrapper for consistent styling
function emailTemplate(content: string, baseUrl: string) {
  const logoUrl = "https://wxgdvnngwwgcrcbjwemg.supabase.co/storage/v1/object/public/email-assets/full-logo.png"

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Studieo</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; color: #171717;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
            <!-- Header with Logo -->
            <tr>
              <td style="padding: 32px 40px; background-color: #ffffff; border-bottom: 1px solid #f5f5f5; text-align: center;">
                <img src="${logoUrl}" alt="Studieo" width="120" style="display: block; margin: 0 auto; max-width: 100%; height: auto; border: 0;">
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px;">
                ${content}
              </td>
            </tr>
                
            <!-- Footer -->
            <tr>
              <td style="background-color: #fafafa; padding: 32px 40px; border-top: 1px solid #f5f5f5; text-align: center;">
                <p style="color: #737373; font-size: 14px; margin: 0; font-weight: 500;">
                  © ${new Date().getFullYear()} Studieo. All rights reserved.
                </p>
                <p style="color: #a3a3a3; font-size: 12px; margin: 12px 0 0 0; line-height: 1.5;">
                  You received this email because you're part of the Studieo platform.<br>
                  <a href="${baseUrl}" style="color: #a3a3a3; text-decoration: underline;">Visit Website</a>
                </p>
              </td>
            </tr>
          </table>
          
          <!-- Spacer -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td height="40" style="font-size: 0; line-height: 0;">&nbsp;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// Button component for emails
function emailButton(text: string, url: string, variant: 'primary' | 'secondary' = 'primary') {
  const bgColor = variant === 'primary' ? '#000' : '#ffffff'
  const textColor = variant === 'primary' ? '#ffffff' : '#000'
  const borderColor = variant === 'secondary' ? '#e5e5e5' : 'transparent'

  return `<table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
  <tr>
    <td style="border-radius: 6px; background-color: ${bgColor}; border: 1px solid ${borderColor};">
      <a href="${url}" style="display: inline-block; padding: 12px 24px; color: ${textColor}; text-decoration: none; font-weight: 600; font-size: 16px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`
}

function getConfirmationEmailTemplate(baseUrl: string) {
  const content = `<h2 style="color: #171717; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">
  Welcome to Studieo!
</h2>
<p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
  Thank you for signing up! We're excited to have you join our community of students and companies collaborating on real-world projects.
</p>
<p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
  To get started, please confirm your email address by clicking the button below:
</p>
${emailButton('Confirm Your Email', '{{ .ConfirmationURL }}')}
<p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
  If you didn't create an account with Studieo, you can safely ignore this email.
</p>
<p style="color: #737373; font-size: 14px; line-height: 20px; margin: 16px 0 0 0;">
  This link will expire in 24 hours for security purposes.
</p>`

  return emailTemplate(content, baseUrl)
}

function getPasswordResetEmailTemplate(baseUrl: string) {
  const content = `<h2 style="color: #171717; font-size: 24px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em;">
  Reset Your Password
</h2>
<p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
  We received a request to reset the password for your Studieo account.
</p>
<p style="color: #525252; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
  Click the button below to create a new password:
</p>
${emailButton('Reset Password', '{{ .ConfirmationURL }}')}
<div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
  <p style="color: #92400e; font-size: 14px; line-height: 20px; margin: 0;">
    <strong>Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
  </p>
</div>
<p style="color: #737373; font-size: 14px; line-height: 20px; margin: 24px 0 0 0;">
  This link will expire in 1 hour for security purposes.
</p>`

  return emailTemplate(content, baseUrl)
}

async function generateTemplates() {
  console.log('Generating Supabase Auth email templates...\n')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://studieo.com'
  console.log(`Using base URL: ${baseUrl}\n`)

  // Generate confirmation email
  const confirmationHTML = getConfirmationEmailTemplate(baseUrl)
  const confirmationPath = path.join(process.cwd(), 'lib', 'email', 'supabase-confirmation-template.html')
  fs.writeFileSync(confirmationPath, confirmationHTML)
  console.log('✅ Confirmation email template saved to:')
  console.log(`   ${confirmationPath}\n`)

  // Generate password reset email
  const resetHTML = getPasswordResetEmailTemplate(baseUrl)
  const resetPath = path.join(process.cwd(), 'lib', 'email', 'supabase-password-reset-template.html')
  fs.writeFileSync(resetPath, resetHTML)
  console.log('✅ Password reset email template saved to:')
  console.log(`   ${resetPath}\n`)

  console.log('📋 Next steps:')
  console.log('1. Go to Supabase Dashboard > Authentication > Email Templates')
  console.log('2. For "Confirm signup" template:')
  console.log('   - Subject: "Welcome to Studieo - Confirm Your Email"')
  console.log('   - Copy contents from supabase-confirmation-template.html')
  console.log('3. For "Reset password" template:')
  console.log('   - Subject: "Reset Your Studieo Password"')
  console.log('   - Copy contents from supabase-password-reset-template.html')
  console.log('\n💡 About the logo:')
  console.log('The logo is referenced from your public folder: /Studieo%20Logo/Full%20Logo.svg')
  console.log(`Make sure this file is accessible at: ${baseUrl}/Studieo%20Logo/Full%20Logo.svg`)
  console.log('\nIf you need to use Supabase Storage instead:')
  console.log('1. Upload the logo to a public bucket in Supabase Storage')
  console.log('2. Get the public URL from Supabase Dashboard')
  console.log('3. Update the logoUrl in this script and regenerate the templates')
}

generateTemplates().catch(console.error)
