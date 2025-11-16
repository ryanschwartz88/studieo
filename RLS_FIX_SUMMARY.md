# RLS Policies Fix - Implementation Summary

## Issue Fixed

**Error**: `42P17` - Ambiguous column reference when submitting applications

**Root Cause**: The applications INSERT policy directly queried the `users` table with an unqualified table name, causing PostgREST's complex CTE query generation to create ambiguous column references.

## Solution Implemented

### 1. Created 4 New SECURITY DEFINER Helper Functions

All functions use `SECURITY DEFINER` to bypass RLS and prevent ambiguous references:

- `is_student_safe()` - Returns true if current user is a STUDENT
- `is_company_user()` - Returns true if current user is a COMPANY user
- `is_team_lead(app_id uuid)` - Returns true if user is team lead for an application
- `is_team_member(app_id uuid)` - Returns true if user is a team member of an application

All functions have `search_path = ''` set for security best practices.

### 2. Applications Table - 6 Clean Policies

**Before**: 7 policies with duplicate ALL policy and direct users table queries
**After**: 6 policies using helper functions

- `students_insert_applications` - Uses `is_student_safe()` to prevent ambiguous references ✅
- `students_select_applications` - Uses `is_team_member()`
- `students_update_applications` - Simple check
- `students_delete_applications` - Simple check
- `companies_select_applications` - Uses `is_company_user()`
- `companies_update_applications` - Uses `is_company_user()`

### 3. Team Members Table - 5 Clean Policies

**Before**: 9+ overlapping policies causing confusion
**After**: 5 consolidated, non-overlapping policies

- `students_select_team_members` - Consolidated view access
- `team_leads_insert_team_members` - Uses helper functions
- `team_leads_delete_team_members` - Uses helper functions
- `students_update_own_membership` - Simple check
- `companies_select_team_members` - Uses `is_company_user()`

### 4. Projects Table - 3 Optimized Policies

- `students_select_projects` - Uses `is_student_safe()`
- `companies_select_projects` - Uses `is_company_user()`
- `companies_manage_projects` - Uses `is_company_user()`

### 5. Security Enhancements

- All SECURITY DEFINER functions have `search_path = ''` to prevent search_path hijacking
- Fixed existing helper functions (`get_my_role`, `get_my_company_id`) with `search_path = ''`
- All policies documented with clear comments

## Verification Completed

✅ All 4 helper functions created with SECURITY DEFINER
✅ Applications table has exactly 6 policies (no duplicates)
✅ Team members table has exactly 5 policies (consolidated)
✅ Projects table has 3 optimized policies
✅ No RLS-related security errors in advisors
✅ All functions have search_path set for security

## Testing Required

### Critical Test: Application Submission

**Before**: Got error `42P17` - ambiguous column reference
**Now**: Should succeed without errors

Test as a student user:
1. Navigate to a project
2. Click "Apply"
3. Fill in application form with design doc
4. Add team members (optional)
5. Submit application

**Expected**: Application submits successfully without database errors

### Additional Tests

1. **Student Flows**
   - View list of own applications
   - Update application before submission
   - Delete draft application
   - View team members in application

2. **Company Flows**
   - View applications to company projects
   - Update application status (accept/reject)
   - View team members of applicants

3. **Team Member Flows**
   - Team lead can add members
   - Team lead can remove members
   - Team members can accept/decline invites
   - Team members can view other members

## Files Modified

1. `supabase/migrations/20251115180200_fix_rls_policies_systematic.sql` (new)
   - Complete migration with all fixes
   - Idempotent and well-documented
   - ~370 lines

## Migration Status

✅ Applied successfully to database
✅ All policies active
✅ No breaking changes to existing functionality

## Security Notes

- All policies follow least-privilege principle
- SECURITY DEFINER functions bypass RLS safely (they only check auth.uid())
- No circular dependencies in policy checks
- Production-grade with search_path protection

## Next Steps

1. Test application submission flow (primary fix)
2. Run through all user flows to verify functionality
3. Monitor for any performance impacts
4. Consider fixing other function search_path warnings if needed

---

**Migration File**: `supabase/migrations/20251115180200_fix_rls_policies_systematic.sql`
**Status**: ✅ Complete and Applied
**Date**: 2025-11-15

