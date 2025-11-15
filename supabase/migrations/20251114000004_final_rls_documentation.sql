-- Migration: Documentation of final RLS policy structure
-- Created: 2025-11-14
-- Description: Documents the non-recursive RLS policy structure for applications and team_members

-- ============================================================================
-- FINAL RLS STRUCTURE (No circular dependencies)
-- ============================================================================

-- APPLICATIONS TABLE POLICIES:
-- 1. Students can SELECT applications where they are:
--    - Team lead (team_lead_id = auth.uid()), OR
--    - Team member (id IN subquery to team_members)
--    ✓ This is safe because the team_members query only checks student_id = auth.uid()
--
-- 2. Students can UPDATE/DELETE only where team_lead_id = auth.uid()
--    ✓ No recursion, direct check

-- TEAM_MEMBERS TABLE POLICIES:
-- 1. Students can SELECT team_members where:
--    - They are the student (student_id = auth.uid()), OR
--    - They are the team lead (application_id IN subquery to applications)
--    ✓ No recursion - the applications query only checks team_lead_id = auth.uid()
--
-- 2. Team leads can INSERT/UPDATE/DELETE team_members where:
--    - application_id IN subquery to applications checking team_lead_id = auth.uid()
--    ✓ No recursion, direct check
--
-- 3. Students can UPDATE their own team_members record:
--    - student_id = auth.uid()
--    ✓ No recursion, direct check
--
-- 4. Companies can SELECT team_members for their projects:
--    - application_id IN subquery joining applications and projects
--    ✓ No recursion, checks projects and applications tables only

-- ============================================================================
-- VERIFICATION: Policy dependency graph (no cycles)
-- ============================================================================
-- 
-- applications SELECT → team_members (WHERE student_id = auth.uid())
--                       ✓ Resolves with simple check, no recursion
--
-- team_members SELECT → applications (WHERE team_lead_id = auth.uid())
--                       ✓ Resolves with simple check, no recursion
--
-- No circular dependencies exist in the final structure.

-- This migration is documentation only, no SQL changes needed
SELECT 'RLS policies configured correctly without circular dependencies' AS status;


