-- Add full-text search support for projects
-- This creates a searchable text vector from multiple fields and enables fast searching

-- Create a function to generate searchable text from project fields
CREATE OR REPLACE FUNCTION public.project_search_vector(project_row public.projects)
RETURNS tsvector AS $$
BEGIN
  RETURN (
    -- Highest priority: skills, project types (what students search for most)
    setweight(to_tsvector('english', COALESCE(array_to_string(project_row.skills_needed, ' '), '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(project_row.project_type, ' '), '')), 'A') ||
    -- High priority: title
    setweight(to_tsvector('english', COALESCE(project_row.title, '')), 'A') ||
    -- Medium priority: summary
    setweight(to_tsvector('english', COALESCE(project_row.short_summary, '')), 'B') ||
    -- Lower priority: detailed text
    setweight(to_tsvector('english', COALESCE(project_row.detailed_description, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(project_row.deliverables, '')), 'C')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a GIN index for fast full-text search
-- Note: We'll use a functional index since we're searching across multiple fields
CREATE INDEX IF NOT EXISTS idx_projects_search 
ON public.projects 
USING GIN (public.project_search_vector(public.projects.*));

-- Create a function to search projects with full-text search
-- This function searches across project fields and company name
CREATE OR REPLACE FUNCTION public.search_projects(
  search_query text,
  project_status_filter public.project_status DEFAULT 'ACCEPTING'::public.project_status,
  access_type_filter public.project_access_type DEFAULT NULL,
  team_min_filter integer DEFAULT NULL,
  team_max_filter integer DEFAULT NULL,
  max_teams_filter integer DEFAULT NULL,
  unlimited_teams boolean DEFAULT false,
  collaboration_filter text[] DEFAULT NULL,
  location_filter text DEFAULT NULL,
  hours_filter text[] DEFAULT NULL,
  sort_by text DEFAULT 'updated_desc'
)
RETURNS TABLE (
  id uuid,
  title text,
  short_summary text,
  detailed_description text,
  deliverables text,
  project_type text[],
  skills_needed text[],
  min_students integer,
  max_students integer,
  weekly_hours integer,
  max_teams integer,
  access_type public.project_access_type,
  status public.project_status,
  start_date date,
  end_date date,
  updated_at timestamptz,
  company_id uuid,
  collaboration_style text,
  location text,
  resource_links text,
  resource_files text[],
  company_name text,
  company_logo_url text,
  view_count integer,
  search_rank real
) AS $$
DECLARE
  tsquery_term tsquery;
  cleaned_query text;
BEGIN
  -- Convert search query to tsquery for full-text search
  -- Handle empty or null search queries
  IF search_query IS NULL OR trim(search_query) = '' THEN
    tsquery_term := to_tsquery('english', '');
  ELSE
    -- Escape special characters and convert to tsquery format
    -- Remove or escape special tsquery characters: & | ! ( ) : * '
    cleaned_query := regexp_replace(trim(search_query), '[&|!():*'']', ' ', 'g');
    -- Normalize whitespace and convert to tsquery format with & (AND) operator
    cleaned_query := regexp_replace(cleaned_query, '\s+', ' & ', 'g');
    -- Add prefix matching to each term (e.g., "desig" matches "design")
    cleaned_query := regexp_replace(cleaned_query, '(\S+)', '\1:*', 'g');
    
    -- Try to create tsquery, fallback to plainto_tsquery if it fails
    BEGIN
      tsquery_term := to_tsquery('english', cleaned_query);
    EXCEPTION WHEN OTHERS THEN
      -- Fallback to plainto_tsquery which is more forgiving
      tsquery_term := plainto_tsquery('english', search_query);
    END;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.short_summary,
    p.detailed_description,
    p.deliverables,
    p.project_type,
    p.skills_needed,
    p.min_students,
    p.max_students,
    p.weekly_hours,
    p.max_teams,
    p.access_type,
    p.status,
    p.start_date,
    p.end_date,
    p.updated_at,
    p.company_id,
    p.collaboration_style,
    p.location,
    p.resource_links,
    p.resource_files,
    c.name AS company_name,
    c.logo_url AS company_logo_url,
    COALESCE(p.view_count, 0) AS view_count,
    -- Calculate search relevance rank
    CASE 
      WHEN search_query IS NULL OR trim(search_query) = '' THEN 0::real
      ELSE ts_rank(
        public.project_search_vector(p.*) ||
        setweight(to_tsvector('english', COALESCE(c.name, '')), 'A'),
        tsquery_term
      )
    END AS search_rank
  FROM public.projects p
  LEFT JOIN public.companies c ON p.company_id = c.id
  WHERE 
    -- Status filter
    p.status = project_status_filter
    -- Access type filter
    AND (access_type_filter IS NULL OR p.access_type = access_type_filter)
    -- Team size filter (overlap logic)
    AND (
      (team_min_filter IS NULL AND team_max_filter IS NULL) OR
      (p.min_students <= COALESCE(NULLIF(team_max_filter, 11), 9999) AND 
       p.max_students >= team_min_filter)
    )
    -- Max teams filter
    AND (
      unlimited_teams = true OR
      max_teams_filter IS NULL OR
      p.max_teams IS NULL OR
      p.max_teams <= max_teams_filter
    )
    -- Collaboration filter
    AND (collaboration_filter IS NULL OR p.collaboration_style = ANY(collaboration_filter))
    -- Location filter
    AND (location_filter IS NULL OR p.location ILIKE '%' || location_filter || '%')
    -- Weekly hours filter
    AND (
      hours_filter IS NULL OR
      EXISTS (
        SELECT 1 FROM unnest(hours_filter) AS hour_bucket
        WHERE 
          (hour_bucket = '1-5' AND p.weekly_hours <= 5) OR
          (hour_bucket = '5-10' AND p.weekly_hours >= 5 AND p.weekly_hours <= 10) OR
          (hour_bucket = '10-15' AND p.weekly_hours >= 10 AND p.weekly_hours <= 15) OR
          (hour_bucket = '15-20' AND p.weekly_hours >= 15 AND p.weekly_hours <= 20) OR
          (hour_bucket = '20+' AND p.weekly_hours >= 20)
      )
    )
    -- Full-text search filter
    AND (
      search_query IS NULL OR trim(search_query) = '' OR
      (
        public.project_search_vector(p.*) ||
        setweight(to_tsvector('english', COALESCE(c.name, '')), 'A')
      ) @@ tsquery_term
    )
  ORDER BY
    CASE sort_by
      WHEN 'relevance' THEN 
        CASE 
          WHEN search_query IS NULL OR trim(search_query) = '' THEN p.updated_at
          ELSE NULL
        END
      ELSE NULL
    END DESC NULLS LAST,
    CASE sort_by
      WHEN 'updated_desc' THEN p.updated_at
      ELSE NULL
    END DESC NULLS LAST,
    CASE sort_by
      WHEN 'earliest_deadline' THEN p.end_date
      ELSE NULL
    END ASC NULLS LAST,
    CASE sort_by
      WHEN 'most_viewed' THEN COALESCE(p.view_count, 0)
      ELSE NULL
    END DESC NULLS LAST,
    -- Default: relevance if search query exists, otherwise updated_at
    CASE 
      WHEN search_query IS NOT NULL AND trim(search_query) != '' AND sort_by = 'relevance' THEN
        ts_rank(
          public.project_search_vector(p.*) ||
          setweight(to_tsvector('english', COALESCE(c.name, '')), 'A'),
          tsquery_term
        )
      ELSE NULL
    END DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_projects TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_projects TO anon;

COMMENT ON FUNCTION public.search_projects IS 'Full-text search for projects with filtering and sorting capabilities';

