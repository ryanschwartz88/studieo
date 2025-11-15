-- Migration: Fix Application Submission RLS Issues
-- Created: 2025-11-13
-- Description: 
--   1. Fix filename mismatch in can_access_design_doc function (design-doc.pdf vs design_doc.pdf)
--   2. Separate the "ALL" policy into distinct SELECT, UPDATE, DELETE policies to avoid INSERT conflicts

-- ============================================================================
-- PART 1: Fix the can_access_design_doc function to use correct filename
-- ============================================================================

CREATE OR REPLACE FUNCTION public.can_access_design_doc(doc_name text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.team_lead_id = auth.uid()
    AND doc_name = (a.id::text || '/design-doc.pdf')  -- ✅ Fixed: use hyphen to match code
  )
  OR EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.student_id = auth.uid()
    AND doc_name = (tm.application_id::text || '/design-doc.pdf')  -- ✅ Fixed: use hyphen
  );
$function$;

-- ============================================================================
-- PART 2: Replace the "ALL" policy with separate SELECT, UPDATE, DELETE policies
-- ============================================================================

-- Drop the problematic "ALL" policy that included INSERT
DROP POLICY IF EXISTS "Students can manage their own applications" ON public.applications;

-- Create separate policies for each operation

-- SELECT: Students can view applications they're part of
CREATE POLICY "Students can view their own applications"
ON public.applications
FOR SELECT
TO public
USING (
  can_access_application(id)
);

-- UPDATE: Students can update their own applications (as team lead only)
CREATE POLICY "Students can update their own applications"
ON public.applications
FOR UPDATE
TO public
USING (
  can_access_application(id)
)
WITH CHECK (
  team_lead_id = auth.uid()
);

-- DELETE: Students can delete their own applications (as team lead only)
CREATE POLICY "Students can delete their own applications"
ON public.applications
FOR DELETE
TO public
USING (
  can_access_application(id) AND team_lead_id = auth.uid()
);

-- ============================================================================
-- VERIFICATION: Ensure policies are correct
-- ============================================================================

-- The INSERT policy "Students can create applications" should remain unchanged:
-- FOR INSERT: WITH CHECK (team_lead_id = auth.uid() AND get_my_role() = 'STUDENT')

COMMENT ON POLICY "Students can view their own applications" ON public.applications IS 
  'Students can view applications where they are team lead or team member';

COMMENT ON POLICY "Students can update their own applications" ON public.applications IS 
  'Students can update applications where they are the team lead';

COMMENT ON POLICY "Students can delete their own applications" ON public.applications IS 
  'Students can delete applications where they are the team lead';

