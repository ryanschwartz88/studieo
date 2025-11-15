# Route Migration Guide: Fix Parallel Routes Conflict

## Problem
Next.js route groups (folders with parentheses like `(student)` and `(company)`) are hidden from URLs, causing both `/(student)/dashboard` and `/(company)/dashboard` to resolve to the same `/dashboard` path, which creates a conflict.

## Solution
Remove the parentheses to make the routes explicit: `/student/dashboard` and `/company/dashboard`.

## Manual Steps Required

### 1. Rename Folders (Windows Command Prompt or File Explorer)

**Option A: Using File Explorer (Recommended for Windows)**
1. Open File Explorer and navigate to `code/app/`
2. Rename the folder `(student)` to `student`
3. Rename the folder `(company)` to `company`

**Option B: Using PowerShell**
```powershell
cd code/app
Rename-Item -Path "(student)" -NewName "student"
Rename-Item -Path "(company)" -NewName "company"
```

### 2. Code Updates (Already Completed ✅)

All code references have been automatically updated:

#### Auth & Redirects
- ✅ `code/app/page.tsx` - Updated redirects to `/student/search` and `/company/dashboard`
- ✅ `code/app/auth/confirm/route.ts` - Updated redirects
- ✅ `code/lib/supabase/auth-helpers.ts` - Updated redirect helpers
- ✅ `code/lib/actions/auth.ts` - Updated sign-in redirects

#### Navigation Components
- ✅ `code/app/(student)/_components/NavigationButtons.tsx` - Updated to `/student/dashboard` and `/student/search`
- ✅ `code/app/(company)/_components/NavigationButtons.tsx` - Updated to `/company/browse` and `/company/projects/new`

#### Layouts
- ✅ `code/app/(student)/layout.tsx` - Updated logo link and profile link
- ✅ `code/app/(company)/layout.tsx` - Updated logo link and settings link

#### Dashboard & Pages
- ✅ `code/app/(student)/dashboard/page.tsx` - Updated all project links to `/student/search/projects/`

#### Server Actions
- ✅ `code/lib/actions/team-members.ts` - Updated revalidatePath calls
- ✅ `code/lib/actions/applications.ts` - Updated revalidatePath calls

## Route Structure After Migration

### Student Routes (Previously `/(student)/`)
- `/student/dashboard` - Student dashboard
- `/student/search` - Browse projects
- `/student/search/projects/[id]` - Project details
- `/student/profile` - Student profile
- `/student/applications` - Applications (placeholder)

### Company Routes (Previously `/(company)/`)
- `/company/dashboard` - Company dashboard
- `/company/browse` - Browse talent
- `/company/projects/new` - Create new project
- `/company/projects/[id]` - Project details & applications
- `/company/settings` - Company settings

### Auth Routes (Unchanged)
- `/auth/login`
- `/auth/sign-up`
- `/auth/onboarding`
- etc.

## Verification Steps

After renaming the folders:

1. **Clear Next.js cache:**
   ```bash
   cd code
   rm -rf .next
   npm run dev
   ```

2. **Test authentication flow:**
   - Login as a student → Should redirect to `/student/search`
   - Login as a company → Should redirect to `/company/dashboard`

3. **Test navigation:**
   - Click sidebar links
   - Verify all routes work correctly
   - Check that no 404 errors occur

4. **Check for any remaining issues:**
   ```bash
   grep -r "href=\"/dashboard\"" code/app --exclude-dir=node_modules
   grep -r "href=\"/search\"" code/app --exclude-dir=node_modules
   ```

## Troubleshooting

### If you see "Page not found" errors:
1. Clear the Next.js cache: `rm -rf code/.next`
2. Restart the dev server: `npm run dev`
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### If some links still point to old routes:
1. Check the verification commands above
2. Search for any hardcoded routes in your browser's local storage/session storage
3. Clear browser cache and cookies

## Benefits of This Change

1. ✅ **No more route conflicts** - Each role has its own distinct URL path
2. ✅ **Better SEO** - Explicit routes are more search-engine friendly
3. ✅ **Clearer URLs** - Users can see immediately if they're on student or company pages
4. ✅ **Easier debugging** - URLs clearly indicate which section of the app is active
5. ✅ **Simpler middleware** - No need for complex route group matching

## Next Steps

After completing the folder renames and verifying everything works:

1. Commit the changes:
   ```bash
   git add .
   git commit -m "refactor: convert route groups to explicit paths to fix parallel routes conflict"
   ```

2. Update any documentation or README files that reference the old routes

3. If you have any E2E tests, update them to use the new routes

