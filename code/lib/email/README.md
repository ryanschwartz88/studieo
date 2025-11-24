# Supabase Auth Email Templates

This directory contains professionally designed email templates for Supabase Authentication.

## 📧 Available Templates

1. **Signup Confirmation Email** - `supabase-confirmation-template.html`
2. **Password Reset Email** - `supabase-password-reset-template.html`

## 🚀 Quick Setup

### Step 1: Generate Templates

Run the generator script to create the HTML files:

```bash
npx tsx lib/email/generate-supabase-templates.ts
```

This will create two `.html` files in this directory.

### Step 2: Configure in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication** > **Email Templates**

#### For Signup Confirmation:
1. Select **"Confirm signup"** template
2. Update the **Subject line**:
   ```
   Welcome to Studieo - Confirm Your Email
   ```
3. Copy the entire contents of `supabase-confirmation-template.html`
4. Paste into the template editor
5. Click **Save**

#### For Password Reset:
1. Select **"Reset password"** template
2. Update the **Subject line**:
   ```
   Reset Your Studieo Password
   ```
3. Copy the entire contents of `supabase-password-reset-template.html`
4. Paste into the template editor
5. Click **Save**

## 🎨 Template Features

- ✅ Consistent branding with your existing email templates
- ✅ Responsive design that works on all devices
- ✅ Professional styling with your Studieo logo
- ✅ Clear call-to-action buttons
- ✅ Security notices and expiration information
- ✅ MSO (Microsoft Outlook) compatibility

## 🖼️ Logo Configuration

### Current Setup (Recommended)
The templates reference your logo from the public folder:
```
https://studieo.com/Studieo%20Logo/Full%20Logo.svg
```

Make sure this file is publicly accessible at this URL.

### Alternative: Using Supabase Storage

If you prefer to host the logo in Supabase Storage:

1. **Upload to Supabase Storage:**
   - Go to Supabase Dashboard > Storage
   - Create a public bucket (e.g., `email-assets`)
   - Upload `Full Logo.svg`
   - Get the public URL

2. **Update the Template Generator:**
   - Open `generate-supabase-templates.ts`
   - Find the `emailTemplate` function
   - Replace the `logoUrl` line with your Supabase Storage URL:
     ```typescript
     const logoUrl = `https://your-project.supabase.co/storage/v1/object/public/email-assets/Full%20Logo.svg`
     ```

3. **Regenerate Templates:**
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

4. **Update in Supabase Dashboard:**
   - Copy the new HTML and paste it into the Supabase email templates again

## 🔧 Customization

### Changing the Base URL

The templates use `https://studieo.com` by default. To change this:

1. Set the `NEXT_PUBLIC_APP_URL` environment variable, or
2. Edit the `baseUrl` in `generate-supabase-templates.ts`

### Modifying Template Content

To customize the email content:

1. Edit the template functions in `lib/email/templates.ts`:
   - `getConfirmationEmailTemplate()`
   - `getPasswordResetEmailTemplate()`

2. Regenerate the HTML files:
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

3. Copy the updated HTML to Supabase Dashboard

## 📝 Template Variables

Supabase automatically replaces these variables:

- `{{ .ConfirmationURL }}` - The confirmation/reset link
- Other variables available in [Supabase docs](https://supabase.com/docs/guides/auth/auth-email-templates)

## 🎯 Best Practices

1. **Test Before Deploying**: Send test emails to yourself to verify rendering
2. **Check Mobile**: View emails on mobile devices to ensure responsiveness
3. **Verify Links**: Make sure the confirmation URLs work correctly
4. **Logo Accessibility**: Ensure your logo URL is publicly accessible
5. **Keep Backups**: Save copies of your templates before making changes

## 📚 Related Files

- `lib/email/templates.ts` - Main email template functions
- `lib/email/index.ts` - Email sending utilities
- `lib/email/generate-supabase-templates.ts` - Template generator script

## 🆘 Troubleshooting

### Logo Not Showing
- Verify the logo URL is publicly accessible
- Check for CORS issues
- Try using Supabase Storage instead

### Styling Issues
- Some email clients strip certain CSS
- The templates use inline styles for maximum compatibility
- Test in multiple email clients (Gmail, Outlook, Apple Mail)

### Variables Not Replacing
- Make sure you're using the exact Supabase variable syntax: `{{ .VariableName }}`
- Don't modify the variable placeholders when copying to Supabase

## 📞 Support

For issues with:
- **Template design**: Check `lib/email/templates.ts`
- **Supabase configuration**: See [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- **Email delivery**: Check your Supabase project's email settings
