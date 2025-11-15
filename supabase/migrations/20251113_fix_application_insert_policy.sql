-- Migration: Simplify INSERT policy to avoid SECURITY DEFINER function issues
-- Created: 2025-11-13
-- Description: Replace get_my_role() with direct subquery to avoid potential context issues

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;

-- Create new INSERT policy with direct role check (no SECURITY DEFINER function)
CREATE POLICY "Students can create applications"
ON public.applications
FOR INSERT
TO public
WITH CHECK (
  team_lead_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'STUDENT'::user_role
  )
);

COMMENT ON POLICY "Students can create applications" ON public.applications IS 
  'Students can create applications where they are the team lead. Uses direct role check to avoid SECURITY DEFINER issues.';


