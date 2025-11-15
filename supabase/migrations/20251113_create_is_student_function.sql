-- Migration: Create a reliable is_student() helper function
-- Created: 2025-11-13
-- Description: Create a simple SECURITY DEFINER function that returns boolean for student check

-- Create helper function to check if current user is a student
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'STUDENT'::user_role
  );
$$;

-- Grant execute to public
GRANT EXECUTE ON FUNCTION public.is_student() TO public;

-- Update the INSERT policy to use the new function
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;

CREATE POLICY "Students can create applications"
ON public.applications
FOR INSERT
TO public
WITH CHECK (
  team_lead_id = auth.uid() 
  AND is_student()
);

COMMENT ON FUNCTION public.is_student() IS 
  'Returns true if the current authenticated user has role STUDENT. Uses SECURITY DEFINER to bypass RLS.';

COMMENT ON POLICY "Students can create applications" ON public.applications IS 
  'Students can create applications where they are the team lead.';


