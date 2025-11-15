-- RPC: search_students
-- Purpose: allow authenticated users to search student directory (id, name, email) safely
-- RLS note: SECURITY DEFINER is used to bypass users table RLS for read-only, limited fields

CREATE OR REPLACE FUNCTION public.search_students(q text)
RETURNS TABLE (
  id uuid,
  name text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    u.id,
    u.name,
    u.email
  FROM public.users u
  WHERE 
    u.role = 'STUDENT'
    AND u.id <> auth.uid()
    AND (
      q IS NULL OR trim(q) = '' OR
      u.name ILIKE '%' || q || '%' OR
      u.email ILIKE '%' || q || '%'
    )
  ORDER BY COALESCE(u.name, u.email) ASC
  LIMIT 50;
$$;

-- Restrict execution to authenticated users only
REVOKE ALL ON FUNCTION public.search_students(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_students(text) TO authenticated;

