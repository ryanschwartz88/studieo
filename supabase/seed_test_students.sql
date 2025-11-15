-- Seed Test Students for Studieo
-- This script creates test student users for development/testing
-- 
-- IMPORTANT: This requires service role privileges to insert into auth.users
-- Run this via Supabase Dashboard SQL Editor with service role, or use Supabase CLI:
--   supabase db execute -f supabase/seed_test_students.sql
--
-- Alternatively, create users via Supabase Auth API or Dashboard, then run the
-- create_test_student() function for each user.

-- ============================================
-- TEST STUDENTS TO CREATE
-- ============================================
-- 1. alice.johnson@stanford.edu - Alice Johnson
-- 2. bob.smith@mit.edu - Bob Smith  
-- 3. charlie.brown@harvard.edu - Charlie Brown
-- 4. diana.prince@berkeley.edu - Diana Prince
-- 5. emma.watson@yale.edu - Emma Watson
-- 6. frank.miller@princeton.edu - Frank Miller
-- 7. grace.lee@columbia.edu - Grace Lee
-- 8. henry.davis@upenn.edu - Henry Davis

-- ============================================
-- OPTION 1: Direct Insert (Service Role Only)
-- ============================================
-- Uncomment and run this section if you have service role access

/*
DO $$
DECLARE
  test_students RECORD;
  user_id uuid;
  encrypted_pw text;
BEGIN
  -- Test students data
  FOR test_students IN 
    SELECT * FROM (VALUES
      ('alice.johnson@stanford.edu', 'Alice Johnson'),
      ('bob.smith@mit.edu', 'Bob Smith'),
      ('charlie.brown@harvard.edu', 'Charlie Brown'),
      ('diana.prince@berkeley.edu', 'Diana Prince'),
      ('emma.watson@yale.edu', 'Emma Watson'),
      ('frank.miller@princeton.edu', 'Frank Miller'),
      ('grace.lee@columbia.edu', 'Grace Lee'),
      ('henry.davis@upenn.edu', 'Henry Davis')
    ) AS t(email, name)
  LOOP
    -- Generate UUID for user
    user_id := gen_random_uuid();
    
    -- Create auth.users record
    -- Note: This requires service role or admin access
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) VALUES (
      user_id,
      '00000000-0000-0000-0000-000000000000',
      test_students.email,
      crypt('testpassword123', gen_salt('bf')),
      now(),
      jsonb_build_object('name', test_students.name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) ON CONFLICT (id) DO NOTHING;
    
    -- The handle_new_user() trigger will automatically create
    -- public.users and student_profiles records
    
    RAISE NOTICE 'Created test student: % (%)', test_students.name, test_students.email;
  END LOOP;
END $$;
*/

-- ============================================
-- OPTION 2: Use Helper Function (After Auth Users Created)
-- ============================================
-- If you've already created auth.users records (via Dashboard or API),
-- you can use the create_test_student() function to populate profiles

-- Example usage (replace UUIDs with actual auth.users.id values):
-- SELECT create_test_student(
--   'YOUR-AUTH-USER-ID-HERE'::uuid,
--   'alice.johnson@stanford.edu',
--   'Alice Johnson'
-- );

-- ============================================
-- OPTION 3: Update Existing Student Profiles
-- ============================================
-- If test students already exist but need profile updates:

UPDATE public.student_profiles
SET 
  grad_date = CASE 
    WHEN random() < 0.33 THEN CURRENT_DATE + INTERVAL '1 year'
    WHEN random() < 0.66 THEN CURRENT_DATE + INTERVAL '2 years'
    ELSE CURRENT_DATE + INTERVAL '3 years'
  END,
  description = CASE (random() * 4)::int
    WHEN 0 THEN 'Passionate about software engineering and AI. Looking for real-world project experience.'
    WHEN 1 THEN 'Design enthusiast with a focus on user experience and product development.'
    WHEN 2 THEN 'Data science student interested in machine learning and analytics.'
    ELSE 'Entrepreneurial student seeking hands-on experience in tech startups.'
  END,
  interests = ARRAY[
    CASE (random() * 3)::int 
      WHEN 0 THEN 'Software Engineering' 
      WHEN 1 THEN 'Product Design' 
      ELSE 'Data Science' 
    END,
    CASE (random() * 3)::int 
      WHEN 0 THEN 'AI/ML' 
      WHEN 1 THEN 'Web Development' 
      ELSE 'Mobile Apps' 
    END
  ],
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.users 
  WHERE role = 'STUDENT' 
  AND email LIKE '%@%.edu'
  AND (grad_date IS NULL OR description IS NULL)
)
RETURNING user_id;

-- ============================================
-- VERIFY CREATED STUDENTS
-- ============================================

SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  asd.school_name,
  sp.grad_date,
  sp.description,
  sp.interests
FROM public.users u
LEFT JOIN public.student_profiles sp ON u.id = sp.user_id
LEFT JOIN public.allowed_school_domains asd ON split_part(u.email, '@', 2) = asd.domain
WHERE u.role = 'STUDENT'
ORDER BY u.created_at DESC
LIMIT 20;

