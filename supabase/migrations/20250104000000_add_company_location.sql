-- Add location field to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS location text;

COMMENT ON COLUMN public.companies.location IS 'Company headquarters location (city, state/country)';

