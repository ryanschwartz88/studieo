# 🔧 Quick Fix: Email Logo Not Showing

## The Problem
You're seeing the alt text instead of the logo because **email clients don't support SVG images**.

## ⚡ Quick Solution (3 Steps)

### Step 1: Convert SVG to PNG

**Option A - Use the converter tool I created:**
1. Make sure your dev server is running (`pnpm dev`)
2. Open in browser: http://localhost:3000/convert-logo.html
3. Click "Download PNG (2x) - 240px (Recommended)"
4. Save the file as `studieo-logo-email.png`

**Option B - Use an online converter:**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `public/Studieo Logo/Full Logo.svg`
3. Set width to 240px
4. Download the PNG

### Step 2: Upload to Supabase Storage

1. Go to your Supabase Dashboard
2. Navigate to **Storage**
3. Click **New bucket**
   - Name: `email-assets`
   - ✅ Make it **Public**
4. Upload your PNG file
5. Right-click the file → **Copy URL**
6. You'll get something like:
   ```
   https://abcdefgh.supabase.co/storage/v1/object/public/email-assets/studieo-logo-email.png
   ```

### Step 3: Update Templates

1. Open `lib/email/generate-supabase-templates.ts`

2. Find line 14 and replace it with your Supabase Storage URL:
   ```typescript
   // OLD:
   const logoUrl = `${baseUrl}/Studieo%20Logo/Full%20Logo.svg`
   
   // NEW:
   const logoUrl = `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/email-assets/studieo-logo-email.png`
   ```

3. Regenerate the templates:
   ```bash
   npx tsx lib/email/generate-supabase-templates.ts
   ```

4. Copy the NEW HTML from the generated files to Supabase Dashboard

## ✅ Done!

Your logo should now display correctly in all email clients.

---

## Why This Happens

- **SVG files are blocked** by most email clients for security reasons
- **PNG/JPG are universally supported** in emails
- **Supabase Storage** provides reliable, fast image hosting

## Alternative: Base64 Embedded Image

If you don't want to use Supabase Storage, you can embed the image directly:

1. Convert PNG to Base64: https://www.base64-image.de/
2. Update the logoUrl to:
   ```typescript
   const logoUrl = `data:image/png;base64,YOUR_BASE64_STRING`
   ```

**Pros:** No external dependencies
**Cons:** Makes email file size larger

---

## Need Help?

See `lib/email/LOGO_SETUP.md` for detailed explanations of all options.
