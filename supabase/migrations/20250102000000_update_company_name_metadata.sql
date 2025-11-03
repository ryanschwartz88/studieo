-- Migration: Update handle_new_user trigger to use company_name from metadata
-- This allows us to collect both the user's name and the company name separately

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
      -- Use company_name from metadata if provided, otherwise fall back to name
      INSERT INTO public.companies (name, domain)
      VALUES (
        COALESCE(
          new.raw_user_meta_data->>'company_name',
          new.raw_user_meta_data->>'name',
          split_part(new.email, '@', 2) -- Fallback to domain if no name provided
        ),
        v_company_domain
      )
      RETURNING id INTO v_company_id;
      
      -- TODO: Trigger notification via http extension or edge function
      -- For now, admins can monitor new companies via Supabase dashboard
    END IF;
  END IF;

  -- Insert into public.users
  -- User's personal name is always stored in the name field
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

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates public.users and student_profiles records when a new auth.users record is created. 
For company users, it also creates or links to a company record using company_name from metadata.
User metadata should include: name (personal name), company_name (for company users), role (for company users).';

