-- Migration: Create design_docs storage bucket and policies
-- Created: 2025-11-15
-- Description: Set up storage for application design documents with proper RLS policies

-- ============================================================================
-- Create storage bucket for design documents
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design_docs',
  'design_docs',
  false, -- Private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.ms-powerpoint'];

-- ============================================================================
-- Storage policies for design_docs bucket
-- ============================================================================

-- Team leads can upload design docs for their applications
-- Path format: {application_id}/design-doc.pdf
DROP POLICY IF EXISTS "Team leads can upload design docs" ON storage.objects;
CREATE POLICY "Team leads can upload design docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design_docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.applications 
      WHERE team_lead_id = auth.uid()
    )
  );

-- Team leads can update (overwrite) their own design docs
DROP POLICY IF EXISTS "Team leads can update design docs" ON storage.objects;
CREATE POLICY "Team leads can update design docs"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'design_docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.applications 
      WHERE team_lead_id = auth.uid()
    )
  );

-- Team members can view design docs for applications they're part of
DROP POLICY IF EXISTS "Team members can view design docs" ON storage.objects;
CREATE POLICY "Team members can view design docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design_docs'
    AND (
      -- Team lead can view
      (storage.foldername(name))[1] IN (
        SELECT id::text 
        FROM public.applications 
        WHERE team_lead_id = auth.uid()
      )
      OR
      -- Team members can view
      (storage.foldername(name))[1] IN (
        SELECT application_id::text 
        FROM public.team_members 
        WHERE student_id = auth.uid()
      )
    )
  );

-- Company users can view design docs for applications to their projects
DROP POLICY IF EXISTS "Companies can view design docs for their projects" ON storage.objects;
CREATE POLICY "Companies can view design docs for their projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design_docs'
    AND (storage.foldername(name))[1] IN (
      SELECT a.id::text
      FROM public.applications a
      JOIN public.projects p ON a.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
    )
  );

-- Team leads can delete their own design docs
DROP POLICY IF EXISTS "Team leads can delete design docs" ON storage.objects;
CREATE POLICY "Team leads can delete design docs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'design_docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.applications 
      WHERE team_lead_id = auth.uid()
    )
  );

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON POLICY "Team leads can upload design docs" ON storage.objects IS
  'Students can upload design documents for applications they lead';

COMMENT ON POLICY "Team leads can update design docs" ON storage.objects IS
  'Students can update (overwrite) design documents for applications they lead';

COMMENT ON POLICY "Team members can view design docs" ON storage.objects IS
  'Team members can view design documents for applications they are part of';

COMMENT ON POLICY "Companies can view design docs for their projects" ON storage.objects IS
  'Company users can view design documents for applications to their projects';

COMMENT ON POLICY "Team leads can delete design docs" ON storage.objects IS
  'Students can delete design documents for applications they lead';

