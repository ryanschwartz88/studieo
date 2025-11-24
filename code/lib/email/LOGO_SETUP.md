# Email Logo Setup Guide

## Problem
Email clients (Gmail, Outlook, etc.) often don't support SVG images or block external images by default.

## Solutions

### Option 1: Convert SVG to PNG and Use Supabase Storage (RECOMMENDED)

1. **Convert your logo to PNG:**
   - Open `public/Studieo Logo/Full Logo.svg` in a browser
   - Take a screenshot or use an online converter like:
     - https://cloudconvert.com/svg-to-png
     - Or use Figma/Photoshop to export as PNG
   - Recommended size: 240px width (2x for retina displays)
   - Save as `full-logo.png`

2. **Upload to Supabase Storage:**
   - Go to Supabase Dashboard > Storage
   - Create a new bucket called `email-assets` (make it PUBLIC)
   - Upload `full-logo.png`
   - Right-click the file > Copy URL
   - You'll get something like:
     ```
     https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/full-logo.png
     ```

3. **Update the template generator:**
   - Edit `lib/email/generate-supabase-templates.ts`
   - Line 14, change:
     ```typescript
     const logoUrl = `${baseUrl}/Studieo%20Logo/Full%20Logo.svg`
     ```
     To:
     ```typescript
     const logoUrl = `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/full-logo.png`
     ```

4. **Regenerate templates:**
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

5. **Copy new HTML to Supabase Dashboard**

---

### Option 2: Use Base64 Embedded Image (Works Everywhere)

This embeds the image directly in the email (no external loading needed).

1. **Convert logo to PNG** (see Option 1, step 1)

2. **Convert PNG to Base64:**
   - Use online tool: https://www.base64-image.de/
   - Or use command line:
     ```bash
     # Windows PowerShell
     [Convert]::ToBase64String([IO.File]::ReadAllBytes("full-logo.png"))
     ```

3. **Update template generator:**
   - Replace the `logoUrl` with:
     ```typescript
     const logoUrl = `data:image/png;base64,YOUR_BASE64_STRING_HERE`
     ```

**Pros:** Works in all email clients, no external dependencies
**Cons:** Makes email larger, harder to update logo later

---

### Option 3: Host PNG on Your Domain (Simple)

1. **Convert logo to PNG** (see Option 1, step 1)

2. **Add PNG to your public folder:**
   - Save as `public/Studieo Logo/full-logo.png`

3. **Update template generator:**
   ```typescript
   const logoUrl = `${baseUrl}/Studieo%20Logo/full-logo.png`
   ```

4. **Regenerate templates:**
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

**Pros:** Simple, easy to update
**Cons:** Requires your domain to be live and accessible

---

### Option 4: Use a CDN (Professional)

Upload to a CDN like:
- Cloudinary
- imgix
- AWS CloudFront

Then use that URL in your templates.

---

## Quick Fix for Testing

If you just want to test quickly, use a placeholder image service:

```typescript
const logoUrl = `https://via.placeholder.com/120x40/000000/FFFFFF?text=STUDIEO`
```

---

## Recommended Approach

For production emails, I recommend **Option 1 (Supabase Storage with PNG)** because:
- ✅ Reliable and fast
- ✅ Works in all email clients
- ✅ Easy to manage in Supabase Dashboard
- ✅ No dependency on your main domain being live
- ✅ PNG format is universally supported

---

## Testing Your Logo

After updating, send a test email to:
- Gmail
- Outlook.com
- Apple Mail (if available)

Check if the logo displays correctly in all clients.
