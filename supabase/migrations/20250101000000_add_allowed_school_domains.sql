-- Migration: Add allowed_school_domains table for dynamic student email validation
-- This replaces the hardcoded array in handle_new_user() trigger

-- Create the allowed_school_domains table
CREATE TABLE IF NOT EXISTS public.allowed_school_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  school_name TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast domain lookups
CREATE INDEX IF NOT EXISTS idx_allowed_school_domains_domain 
ON public.allowed_school_domains(domain) WHERE active = TRUE;

-- Enable RLS
ALTER TABLE public.allowed_school_domains ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read active domains (needed for signup validation)
CREATE POLICY "Anyone can view active school domains"
ON public.allowed_school_domains
FOR SELECT
USING (active = TRUE);

-- Only service role can modify (admins use Supabase dashboard)
-- No policies for INSERT/UPDATE/DELETE means only service role can modify

-- Seed initial universities
INSERT INTO public.allowed_school_domains (domain, school_name) VALUES
  ('stanford.edu', 'Stanford University'),
  ('berkeley.edu', 'UC Berkeley'),
  ('caltech.edu', 'California Institute of Technology'),
  ('mit.edu', 'Massachusetts Institute of Technology'),
  ('harvard.edu', 'Harvard University'),
  ('yale.edu', 'Yale University'),
  ('princeton.edu', 'Princeton University'),
  ('columbia.edu', 'Columbia University'),
  ('upenn.edu', 'University of Pennsylvania'),
  ('cornell.edu', 'Cornell University'),
  ('brown.edu', 'Brown University'),
  ('dartmouth.edu', 'Dartmouth College')
ON CONFLICT (domain) DO NOTHING;

-- Update the handle_new_user() function to query this table instead of using hardcoded array
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role public.user_role;
  v_company_domain text;
  v_company_id uuid;
  v_is_valid_edu BOOLEAN;
BEGIN
  -- Extract domain
  v_company_domain := split_part(new.email, '@', 2);

  -- Check if domain is in allowed_school_domains table
  SELECT EXISTS (
    SELECT 1 FROM public.allowed_school_domains 
    WHERE domain = v_company_domain AND active = TRUE
  ) INTO v_is_valid_edu;

  -- Determine role
  IF v_is_valid_edu THEN
    v_role := 'STUDENT';
    v_company_id := NULL;
  ELSE
    v_role := 'COMPANY';
    -- Find or create company
    SELECT id INTO v_company_id FROM public.companies WHERE domain = v_company_domain;
    
    IF v_company_id IS NULL THEN
      -- Create a shell company. Admin will vet and fill details.
      INSERT INTO public.companies (name, domain)
      VALUES (new.raw_user_meta_data->>'name', v_company_domain)
      RETURNING id INTO v_company_id;
      
      -- TODO: Trigger notification via http extension or edge function
      -- For now, admins can monitor new companies via Supabase dashboard
    END IF;
  END IF;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role, company_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', v_role, v_company_id);
  
  -- If student, create a student_profile
  IF v_role = 'STUDENT' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$;

-- Ensure the trigger is still attached (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add comment for documentation
COMMENT ON TABLE public.allowed_school_domains IS 
'Whitelist of university email domains. Students can only sign up with emails from these domains.';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates public.users and student_profiles records when a new auth.users record is created. 
Determines role based on email domain (student vs company) by querying allowed_school_domains table.';

