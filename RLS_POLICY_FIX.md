# RLS Policy Fix - Browse Page Access

## Problem

Company users could only see projects from their own company in the browse page, even though the browse page is meant to show all available projects for discovery.

## Root Cause

The RLS policy `"Company users can see all projects for their company"` was too restrictive:

```sql
-- OLD POLICY (Too Restrictive)
CREATE POLICY "Company users can see all projects for their company"
  ON public.projects FOR SELECT
  USING (
    company_id = get_my_company_id() AND 
    get_my_role() = 'COMPANY'::user_role
  );
```

This meant company users could **only** see their own company's projects, not all available projects for browsing.

## Solution

Updated the policy to allow company users to:
1. **Browse all ACCEPTING projects** (for discovery and inspiration)
2. **Still manage their own company's projects** (for editing, etc.)

```sql
-- NEW POLICY (Allows Browsing)
CREATE POLICY "Company users can browse all ACCEPTING projects"
  ON public.projects FOR SELECT
  USING (
    -- Allow if project is ACCEPTING (for browsing)
    (status = 'ACCEPTING' AND get_my_role() = 'COMPANY'::user_role)
    OR
    -- OR if it's their own company's project (for managing)
    (company_id = get_my_company_id() AND get_my_role() = 'COMPANY'::user_role)
  );
```

## Security Maintained

- ✅ **Edit restrictions still apply**: The `"Company users can manage all projects for their company"` policy still restricts INSERT/UPDATE/DELETE to own company
- ✅ **Creator-only editing**: Server actions still check `created_by_id` before allowing edits
- ✅ **Students unchanged**: Students can still see all ACCEPTING projects (existing policy)

## Result

Now company users can:
- ✅ Browse all ACCEPTING projects from any company
- ✅ View project details from competitors (for inspiration)
- ✅ Still only edit their own company's projects
- ✅ Still only see non-ACCEPTING projects from their own company

## Migration Applied

- `20250106000002_allow_company_users_to_browse_all_projects.sql`

## Testing

1. Log in as company user
2. Navigate to `/browse`
3. Should see **all ACCEPTING projects** from all companies
4. Try to edit a project from another company → Should be blocked
5. Try to edit your own project → Should work (if you're the creator)

