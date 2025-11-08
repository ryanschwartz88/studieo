-- Migration: Add logo_url to companies table and create company_logos storage bucket

-- Add logo_url column to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS logo_url text;

-- Create company_logos storage bucket (public for authenticated users via RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('company_logos', 'company_logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS Policies for company_logos bucket
-- Drop existing policies if they exist, then recreate them

DROP POLICY IF EXISTS "Company members can upload logos for their company" ON storage.objects;
CREATE POLICY "Company members can upload logos for their company"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company_logos'
    AND public.get_my_role() = 'COMPANY'
    AND name LIKE (public.get_my_company_id()::text || '/logo.%')
  );

DROP POLICY IF EXISTS "Company members can update logos for their company" ON storage.objects;
CREATE POLICY "Company members can update logos for their company"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'company_logos'
    AND public.get_my_role() = 'COMPANY'
    AND name LIKE (public.get_my_company_id()::text || '/logo.%')
  );

DROP POLICY IF EXISTS "Authenticated users can read company logos" ON storage.objects;
CREATE POLICY "Authenticated users can read company logos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company_logos'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Company members can delete logos for their company" ON storage.objects;
CREATE POLICY "Company members can delete logos for their company"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'company_logos'
    AND public.get_my_role() = 'COMPANY'
    AND name LIKE (public.get_my_company_id()::text || '/logo.%')
  );

