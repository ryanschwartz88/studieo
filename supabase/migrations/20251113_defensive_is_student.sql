-- Migration: Make is_student() more defensive
-- Created: 2025-11-13
-- Description: Add NULL handling and better error checking

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_role user_role;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- If not authenticated, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get the user's role
  SELECT role INTO user_role
  FROM public.users
  WHERE id = current_user_id;
  
  -- Return true if role is STUDENT
  RETURN (user_role = 'STUDENT'::user_role);
END;
$$;

COMMENT ON FUNCTION public.is_student() IS 
  'Returns true if the current authenticated user has role STUDENT. Returns false if not authenticated or not a student. Uses SECURITY DEFINER to bypass RLS.';


