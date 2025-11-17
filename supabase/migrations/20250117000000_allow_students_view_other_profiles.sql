-- Migration: Allow students to view other students' profiles
-- Created: 2025-01-17
-- Description: Add RLS policy to allow students to view other students' profiles for the student directory feature

-- ============================================================================
-- Add SELECT policy for students to view other students' profiles
-- ============================================================================

-- Students can view other students' profiles (for student directory/search)
-- Uses is_student_safe() helper function to avoid RLS recursion
CREATE POLICY "Students can view other student profiles"
  ON public.student_profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Current user must be a student (uses SECURITY DEFINER function to avoid recursion)
    is_student_safe()
    -- Profile being viewed must belong to a student user
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = student_profiles.user_id
      AND role = 'STUDENT'::user_role
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Students can view other student profiles" ON public.student_profiles IS
  'Allows students to view other students'' profiles for the student directory and team building features.';

