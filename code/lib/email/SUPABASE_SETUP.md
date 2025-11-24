# Supabase Email Template Setup - Quick Reference

## ✅ What Was Created

1. **Two new template functions** in `lib/email/templates.ts`:
   - `getConfirmationEmailTemplate()` - For signup confirmations
   - `getPasswordResetEmailTemplate()` - For password resets

2. **Template generator script**: `lib/email/generate-supabase-templates.ts`
   - Generates ready-to-paste HTML files

3. **Generated HTML files**:
   - `supabase-confirmation-template.html`
   - `supabase-password-reset-template.html`

4. **Documentation**: `lib/email/README.md`

## 📋 Copy to Supabase Dashboard

### Confirmation Email Template

**Subject:**
```
Welcome to Studieo - Confirm Your Email
```

**HTML:** Copy from `lib/email/supabase-confirmation-template.html`

---

### Password Reset Email Template

**Subject:**
```
Reset Your Studieo Password
```

**HTML:** Copy from `lib/email/supabase-password-reset-template.html`

---

## 🖼️ Logo Setup Options

### Option 1: Use Public Folder (Current - Recommended)
✅ Already configured!
- Logo URL: `https://studieo.com/Studieo%20Logo/Full%20Logo.svg`
- Just make sure this file is accessible at your domain

### Option 2: Use Supabase Storage

If you prefer to host the logo in Supabase:

1. **Upload to Supabase Storage:**
   ```
   Dashboard > Storage > Create bucket "email-assets" (public)
   Upload: Full Logo.svg
   ```

2. **Get the public URL** from Supabase (right-click > Copy URL)

3. **Update the generator script:**
   - Edit `lib/email/generate-supabase-templates.ts`
   - Line 14: Replace with your Supabase Storage URL
   ```typescript
   const logoUrl = `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/Full%20Logo.svg`
   ```

4. **Regenerate templates:**
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

5. **Copy new HTML to Supabase Dashboard**

## 🎯 Where to Paste in Supabase

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Email Templates**
4. Choose template type (Confirm signup / Reset password)
5. Paste the subject line
6. Paste the HTML content
7. Click **Save**

## 🔍 Template Preview

Both templates include:
- ✅ Studieo logo header
- ✅ Professional welcome/reset message
- ✅ Prominent CTA button (black background, white text)
- ✅ Security notices
- ✅ Expiration information
- ✅ Branded footer with copyright
- ✅ Responsive design
- ✅ Email client compatibility

## 📱 Next Steps

1. ✅ Templates are generated and ready
2. ⏳ Copy HTML to Supabase Dashboard (see above)
3. ⏳ Set the subject lines
4. ⏳ Send test emails to verify
5. ⏳ Verify logo displays correctly

## 💡 Pro Tips

- Test emails in multiple clients (Gmail, Outlook, Apple Mail)
- Send a test signup to see the confirmation email
- Try the password reset flow to test that template
- Keep the generated HTML files for future reference
- If you update templates, regenerate and re-paste to Supabase
