-- Add project view tracking
-- Uses a hybrid approach: detailed tracking table + cached counter for performance

-- 1. Add view_count to projects table for fast display
ALTER TABLE public.projects
ADD COLUMN view_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.projects.view_count IS 'Cached count of unique project views for fast display';

-- 2. Create project_views table for detailed tracking
CREATE TABLE public.project_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  -- user_id is nullable to track anonymous views (not logged in)
  -- but for Studieo, we likely only track authenticated views
  
  viewed_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Prevent duplicate tracking: one view per user per project
  UNIQUE(project_id, user_id)
);

COMMENT ON TABLE public.project_views IS 'Tracks individual project views for analytics and duplicate prevention';

-- Create indexes for common queries
CREATE INDEX idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX idx_project_views_user_id ON public.project_views(user_id);
CREATE INDEX idx_project_views_viewed_at ON public.project_views(viewed_at DESC);

-- 3. Create function to record a project view
-- This function handles both inserting into project_views and updating the counter
CREATE OR REPLACE FUNCTION public.record_project_view(
  p_project_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_new_view boolean;
  v_current_count integer;
BEGIN
  -- Try to insert the view (will fail if already viewed due to UNIQUE constraint)
  INSERT INTO public.project_views (project_id, user_id, viewed_at)
  VALUES (p_project_id, p_user_id, now())
  ON CONFLICT (project_id, user_id) DO UPDATE
    SET viewed_at = now() -- Update timestamp if already viewed
  RETURNING (xmax = 0) INTO v_is_new_view; -- xmax = 0 means INSERT, not UPDATE
  
  -- If this is a new view, increment the counter
  IF v_is_new_view THEN
    UPDATE public.projects
    SET view_count = view_count + 1
    WHERE id = p_project_id
    RETURNING view_count INTO v_current_count;
  ELSE
    -- Get current count without updating
    SELECT view_count INTO v_current_count
    FROM public.projects
    WHERE id = p_project_id;
  END IF;
  
  -- Return result
  RETURN jsonb_build_object(
    'is_new_view', v_is_new_view,
    'view_count', v_current_count
  );
END;
$$;

COMMENT ON FUNCTION public.record_project_view IS 'Records a project view and updates the view counter. Only counts unique views per user.';

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.record_project_view TO authenticated;

-- 4. Enable RLS on project_views
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view project view data for projects they have access to
CREATE POLICY "Students can see view counts for ACCEPTING projects"
  ON public.project_views FOR SELECT
  USING (
    public.get_my_role() = 'STUDENT' AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.project_views.project_id
      AND p.status = 'ACCEPTING'
    )
  );

-- Company users can see view analytics for their own projects
CREATE POLICY "Company users can see views for their projects"
  ON public.project_views FOR SELECT
  USING (
    public.get_my_role() = 'COMPANY' AND
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.project_views.project_id
      AND p.company_id = public.get_my_company_id()
    )
  );

-- Users can see their own view history
CREATE POLICY "Users can see their own view history"
  ON public.project_views FOR SELECT
  USING (user_id = auth.uid());

-- 5. Create view for trending projects (useful for analytics)
CREATE OR REPLACE VIEW public.trending_projects AS
SELECT 
  p.id,
  p.title,
  p.company_id,
  c.name AS company_name,
  p.status,
  p.view_count,
  COUNT(pv.id) FILTER (WHERE pv.viewed_at > now() - interval '7 days') AS views_last_7_days,
  COUNT(pv.id) FILTER (WHERE pv.viewed_at > now() - interval '24 hours') AS views_last_24_hours,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.companies c ON p.company_id = c.id
LEFT JOIN public.project_views pv ON p.id = pv.project_id
WHERE p.status = 'ACCEPTING'
GROUP BY p.id, c.name
ORDER BY views_last_7_days DESC, p.view_count DESC;

COMMENT ON VIEW public.trending_projects IS 'Shows trending projects based on recent view activity';

-- Grant access to the view
GRANT SELECT ON public.trending_projects TO authenticated;

-- 6. Create function to get user's recently viewed projects
CREATE OR REPLACE FUNCTION public.get_recently_viewed_projects(
  p_user_id uuid DEFAULT auth.uid(),
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  project_id uuid,
  project_title text,
  company_name text,
  company_logo_url text,
  viewed_at timestamptz,
  project_status project_status
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS project_id,
    p.title AS project_title,
    c.name AS company_name,
    c.logo_url AS company_logo_url,
    pv.viewed_at,
    p.status AS project_status
  FROM public.project_views pv
  JOIN public.projects p ON pv.project_id = p.id
  LEFT JOIN public.companies c ON p.company_id = c.id
  WHERE pv.user_id = p_user_id
  ORDER BY pv.viewed_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.get_recently_viewed_projects IS 'Returns a user''s recently viewed projects';

GRANT EXECUTE ON FUNCTION public.get_recently_viewed_projects TO authenticated;

