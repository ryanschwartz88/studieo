# supabase/AGENTS.md — Backend

This file provides guidance for database schema, migrations, RLS policies, storage, and server-side logic for Studieo.

## Purpose

The backend is responsible for:
- Database schema and relationships
- Row-Level Security (RLS) policies
- Storage buckets for file uploads
- Email notifications via Resend
- Data validation and business logic enforcement
- Auth triggers for auto-user creation

## Database Schema

### Enums (Custom Types)

```sql
-- User role for the entire platform
CREATE TYPE public.user_role AS ENUM (
  'STUDENT',
  'COMPANY'
);

-- Lifecycle status for a project
CREATE TYPE public.project_status AS ENUM (
  'INCOMPLETE',  -- Draft, not visible to students
  'SCHEDULED',   -- Approved, to be opened in the future
  'OPEN',        -- Visible, accepting applications
  'IN_PROGRESS', -- Teams selected, work has begun
  'COMPLETED'    -- Project finished
);

-- Student's application status for a specific project
CREATE TYPE public.application_status AS ENUM (
  'PENDING',    -- Team lead is building team, not submitted
  'SUBMITTED',  -- Submitted, awaiting review
  'ACCEPTED',
  'REJECTED'
);

-- Status for a student invited to a team
CREATE TYPE public.team_invite_status AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DECLINED'
);

-- Confidentiality options for a project
CREATE TYPE public.confidentiality_type AS ENUM (
  'PUBLIC',
  'CONFIDENTIAL_NO_NDA',
  'NDA_REQUIRED'
);

-- Mentorship options for a project
CREATE TYPE public.mentorship_preference AS ENUM (
  'YES',
  'NO',
  'OTHER'
);

-- Company industry sectors
CREATE TYPE public.industry_sector AS ENUM (
  'TECHNOLOGY',
  'HEALTHCARE',
  'FINANCE',
  'EDUCATION',
  'CONSUMER_GOODS',
  'MEDIA_ENTERTAINMENT',
  'TRANSPORTATION',
  'SUSTAINABILITY',
  'GOVERNMENT',
  'NONPROFIT',
  'REAL_ESTATE',
  'LEGAL',
  'FOOD_BEVERAGE',
  'OTHER'
);
```

### Core Tables

#### `companies`

Stores company profiles (manually vetted by admins).

```sql
CREATE TABLE public.companies (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  domain      text NOT NULL UNIQUE, -- e.g., "google.com"
  website     text,                 -- Nullable, for admin manual entry
  sector      public.industry_sector, -- Nullable, for admin manual entry
  description text,                 -- Nullable, for admin manual entry
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_companies_domain ON companies(domain);
```

**RLS Policies**:
- **Authenticated users can see all**: SELECT for authenticated users (for browsing)
- **Company members can update their own**: UPDATE where `id = get_my_company_id()`

#### `users`

Main user table for both students and company users. Populated by auth trigger.

```sql
CREATE TABLE public.users (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL UNIQUE,
  name        text,
  role        public.user_role NOT NULL,
  company_id  uuid REFERENCES public.companies(id) ON DELETE SET NULL, -- Null for students
  created_at  timestamp with time zone DEFAULT now() NOT NULL,
  updated_at  timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_id ON users(company_id);
```

**RLS Policies**:
- **Users can view and edit their own data**: FOR ALL WHERE `id = auth.uid()`

**Note**: This table is auto-populated by the `handle_new_user()` trigger when users sign up via Supabase Auth.

#### `student_profiles`

Student-specific profile info (1-to-1 with users where role='STUDENT').

```sql
CREATE TABLE public.student_profiles (
  user_id       uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  description   text,
  grad_date     date,
  resume_url    text,                 -- Path to file in Supabase Storage
  interests     text[],               -- Array of tags
  updated_at    timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_student_profiles_user_id ON student_profiles(user_id);
```

**RLS Policies**:
- **Students can view and edit their own profile**: FOR ALL WHERE `user_id = auth.uid()`
- **Company users can view profiles of their applicants**: SELECT when viewing application teams

**Note**: Auto-created by `handle_new_user()` trigger for student signups.

#### `projects`

Company projects posted for students to apply to.

```sql
CREATE TABLE public.projects (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  status              public.project_status NOT NULL DEFAULT 'INCOMPLETE',
  
  -- Project Info
  title               text NOT NULL,
  short_summary       text NOT NULL,
  detailed_description text NOT NULL,
  project_type        text[] NOT NULL, -- "Market Research", "Software Engineering", etc.
  tags                text[],
  deliverables        text NOT NULL,
  skills_needed       text[],
  
  -- Point of Contact
  contact_name        text NOT NULL,
  contact_role        text NOT NULL,
  contact_email       text NOT NULL,
  
  -- Additional Resources
  resource_links      text,
  resource_files      text[], -- Array of URLs (e.g., to Supabase Storage)
  internal_notes      text,   -- Only visible to company users
  
  -- Configuration ("Unchangeable" Fields)
  start_date          date,
  end_date            date,
  min_students        int NOT NULL DEFAULT 1,
  max_students        int NOT NULL DEFAULT 3,
  min_teams           int NOT NULL DEFAULT 1,
  max_teams           int NOT NULL DEFAULT 1,
  weekly_hours        int,    -- Estimated hours per week
  collaboration_style text[] NOT NULL, -- "Fully asynchronous", "Weekly check-ins", etc.
  mentorship          public.mentorship_preference NOT NULL DEFAULT 'OTHER',
  confidentiality     public.confidentiality_type NOT NULL DEFAULT 'PUBLIC',
  
  created_at          timestamp with time zone DEFAULT now() NOT NULL,
  updated_at          timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_skills ON projects USING GIN(skills_needed);
CREATE INDEX idx_projects_type ON projects USING GIN(project_type);
```

**RLS Policies**:
- **Students can see OPEN projects**: SELECT WHERE `status = 'OPEN' AND get_my_role() = 'STUDENT'`
- **Company users can see all projects for their company**: SELECT WHERE `company_id = get_my_company_id()`
- **Company users can manage projects**: FOR ALL WHERE `company_id = get_my_company_id()`

#### `applications`

Student team applications to projects.

```sql
CREATE TABLE public.applications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  team_lead_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  status          public.application_status NOT NULL DEFAULT 'PENDING',
  design_doc_url  text, -- Path to file in Supabase Storage
  optional_answers jsonb, -- For optional questions
  
  created_at      timestamp with time zone DEFAULT now() NOT NULL,
  updated_at      timestamp with time zone DEFAULT now() NOT NULL,
  
  -- A student can only lead one application per project
  UNIQUE(project_id, team_lead_id)
);

CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_team_lead_id ON applications(team_lead_id);
CREATE INDEX idx_applications_status ON applications(status);
```

**RLS Policies**:
- **Students can see and manage their own applications**: FOR ALL WHERE team_lead is user OR user is team member
- **Company users can see applications for their projects**: FOR ALL WHERE project belongs to their company

#### `team_members`

Junction table for students invited to an application team.

```sql
CREATE TABLE public.team_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_status   public.team_invite_status NOT NULL DEFAULT 'PENDING',
  
  -- A student can only be on one team per application
  UNIQUE(application_id, student_id)
);

CREATE INDEX idx_team_members_application_id ON team_members(application_id);
CREATE INDEX idx_team_members_student_id ON team_members(student_id);
```

**RLS Policies**:
- **Students can manage their own team memberships**: FOR ALL WHERE `student_id = auth.uid()`
- **Team leads can manage their team**: FOR ALL WHERE they own the application
- **Company users can see team members**: SELECT when viewing applications

#### `saved_projects`

Junction table for students "saving" projects.

```sql
CREATE TABLE public.saved_projects (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id   uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at   timestamp with time zone DEFAULT now() NOT NULL,
  
  -- A user can only save a project once
  UNIQUE(user_id, project_id)
);

CREATE INDEX idx_saved_projects_user_id ON saved_projects(user_id);
CREATE INDEX idx_saved_projects_project_id ON saved_projects(project_id);
```

**RLS Policies**:
- **Students can manage their own saved projects**: FOR ALL WHERE `user_id = auth.uid()`

#### `allowed_school_domains` (Recommended Addition)

Whitelist of university email domains. **Note**: Currently in auth trigger as hardcoded array, recommended to move to database.

```sql
CREATE TABLE public.allowed_school_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  school_name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_allowed_domains ON allowed_school_domains(domain);
```

**Seed Data**:
```sql
INSERT INTO allowed_school_domains (domain, school_name) VALUES
  ('stanford.edu', 'Stanford University'),
  ('berkeley.edu', 'UC Berkeley'),
  ('caltech.edu', 'Caltech');
-- Add remaining universities
```

## Auth Triggers & Functions

### Auto-Create User on Signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role public.user_role;
  v_company_domain text;
  v_company_id uuid;
  v_curated_edu_domains text[] := ARRAY[
    'stanford.edu', 
    'berkeley.edu', 
    'caltech.edu'
    -- Add all 12 universities
  ];
BEGIN
  -- Extract domain
  v_company_domain := split_part(new.email, '@', 2);
  
  -- Determine role
  IF v_company_domain = ANY(v_curated_edu_domains) THEN
    v_role := 'STUDENT';
    v_company_id := NULL;
  ELSE
    v_role := 'COMPANY';
    -- Find or create company
    SELECT id INTO v_company_id 
    FROM public.companies 
    WHERE domain = v_company_domain;
    
    IF v_company_id IS NULL THEN
      -- Create shell company (admin will vet and fill details)
      INSERT INTO public.companies (name, domain)
      VALUES (new.raw_user_meta_data->>'name', v_company_domain)
      RETURNING id INTO v_company_id;
      
      -- TODO: Trigger admin notification via Resend
    END IF;
  END IF;
  
  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role, company_id)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name', v_role, v_company_id);
  
  -- If student, create student_profile
  IF v_role = 'STUDENT' THEN
    INSERT INTO public.student_profiles (user_id)
    VALUES (new.id);
  END IF;
  
  RETURN new;
END;
$$;

-- Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Helper Functions

#### Get Current User's Role

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
$$;
```

#### Get Current User's Company ID

```sql
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
$$;
```

## Row-Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_projects ENABLE ROW LEVEL SECURITY;
```

### Example Policies (From Deployed Schema)

#### Users Table

```sql
CREATE POLICY "Users can view and edit their own data"
  ON public.users FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

#### Student Profiles

```sql
CREATE POLICY "Students can view and edit their own profile"
  ON public.student_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Company users can view profiles of their applicants"
  ON public.student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.team_members tm ON a.id = tm.application_id
      JOIN public.projects p ON a.project_id = p.id
      WHERE tm.student_id = public.student_profiles.user_id
      AND p.company_id = public.get_my_company_id()
      AND public.get_my_role() = 'COMPANY'
    )
  );
```

#### Companies

```sql
CREATE POLICY "Authenticated users can see all company info (for browsing)"
  ON public.companies FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Company members can update their own company info"
  ON public.companies FOR UPDATE
  USING (id = public.get_my_company_id() AND public.get_my_role() = 'COMPANY')
  WITH CHECK (id = public.get_my_company_id() AND public.get_my_role() = 'COMPANY');
```

#### Projects

```sql
CREATE POLICY "Students can see OPEN projects"
  ON public.projects FOR SELECT
  USING (status = 'OPEN' AND public.get_my_role() = 'STUDENT');

CREATE POLICY "Company users can see all projects for their company"
  ON public.projects FOR SELECT
  USING (company_id = public.get_my_company_id() AND public.get_my_role() = 'COMPANY');

CREATE POLICY "Company users can manage all projects for their company"
  ON public.projects FOR ALL
  USING (company_id = public.get_my_company_id() AND public.get_my_role() = 'COMPANY')
  WITH CHECK (company_id = public.get_my_company_id() AND public.get_my_role() = 'COMPANY');
```

#### Applications

```sql
CREATE POLICY "Students can see and manage their own applications"
  ON public.applications FOR ALL
  USING (
    team_lead_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.application_id = public.applications.id
      AND tm.student_id = auth.uid()
    )
  );

CREATE POLICY "Company users can see applications for their projects"
  ON public.applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = public.applications.project_id
      AND p.company_id = public.get_my_company_id()
    ) AND public.get_my_role() = 'COMPANY'
  );
```

#### Team Members

```sql
CREATE POLICY "Students can manage their own team memberships"
  ON public.team_members FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "Team leads can manage their team"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = public.team_members.application_id
      AND a.team_lead_id = auth.uid()
    )
  );

CREATE POLICY "Company users can see team members for their applications"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON a.project_id = p.id
      WHERE a.id = public.team_members.application_id
      AND p.company_id = public.get_my_company_id()
    ) AND public.get_my_role() = 'COMPANY'
  );
```

#### Saved Projects

```sql
CREATE POLICY "Students can manage their own saved projects"
  ON public.saved_projects FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

## Storage Buckets & Policies

### Resumes Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;
```

**Storage Path**: `{user_id}/resume.pdf`

**Policies**:

```sql
-- Students can upload their own resume
CREATE POLICY "Students can upload their own resume"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes'
    AND public.get_my_role() = 'STUDENT'
    AND name = (auth.uid()::text || '/resume.pdf')
  );

-- Students can see their own resume
CREATE POLICY "Students can see their own resume"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND public.get_my_role() = 'STUDENT'
    AND name = (auth.uid()::text || '/resume.pdf')
  );

-- Company users can see resumes of their applicants
CREATE POLICY "Company users can see resumes of their applicants"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes'
    AND public.get_my_role() = 'COMPANY'
    AND EXISTS (
      SELECT 1
      FROM public.student_profiles sp
      JOIN public.team_members tm ON sp.user_id = tm.student_id
      JOIN public.applications a ON tm.application_id = a.id
      JOIN public.projects p ON a.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
      AND sp.resume_url = 'resumes/' || storage.objects.name
    )
  );
```

### Design Docs Bucket

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('design_docs', 'design_docs', false)
ON CONFLICT (id) DO NOTHING;
```

**Storage Path**: `{application_id}/design_doc.pdf`

**Policies**:

```sql
-- Team leads can upload design docs for their application
CREATE POLICY "Team leads can upload design docs for their application"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'design_docs'
    AND public.get_my_role() = 'STUDENT'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.team_lead_id = auth.uid()
      AND name = (a.id::text || '/design_doc.pdf')
    )
  );

-- Team members can view their team's design doc
CREATE POLICY "Team members can view their team's design doc"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design_docs'
    AND public.get_my_role() = 'STUDENT'
    AND EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.student_id = auth.uid()
      AND name = (tm.application_id::text || '/design_doc.pdf')
    )
  );

-- Company users can view design docs for their projects
CREATE POLICY "Company users can view design docs for their projects"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'design_docs'
    AND public.get_my_role() = 'COMPANY'
    AND EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.projects p ON a.project_id = p.id
      WHERE p.company_id = public.get_my_company_id()
      AND name = (a.id::text || '/design_doc.pdf')
    )
  );
```

## Migrations

### Migration Naming Convention

```
NNNN_descriptive_name.sql
```

Examples:
- `0001_init_schema.sql` — Core tables and enums
- `0002_rls_policies.sql` — Row-level security policies
- `0003_storage_buckets.sql` — Storage bucket configuration
- `0004_auth_triggers.sql` — Auth triggers and helper functions

### Creating Migrations with Supabase MCP

```
"list migrations"
"apply migration for allowed_school_domains table"
"generate TypeScript types from database schema"
```

### Migration Best Practices

- **One logical change per migration**: Separate schema from RLS from data
- **Test locally first**: Use Supabase CLI or MCP to test
- **Never edit past migrations**: Create new migrations to fix issues
- **Document breaking changes**: Add comments explaining why

## Server Actions Integration

### Domain Validation

Recommended to move hardcoded domains from trigger to database table, then validate in server actions:

```typescript
// lib/actions/auth.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function validateStudentEmail(email: string) {
  const supabase = await createClient();
  const domain = email.split('@')[1].toLowerCase();
  
  const { data } = await supabase
    .from('allowed_school_domains')
    .select('domain')
    .eq('domain', domain)
    .eq('active', true)
    .single();
  
  return { isValid: !!data };
}
```

### Company Auto-Linking

The `handle_new_user()` trigger handles this automatically, but you can query in server actions:

```typescript
// lib/actions/users.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  return data;
}
```

## Email Notifications (Resend)

### Setup

```typescript
// lib/email/index.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  return await resend.emails.send({
    from: 'Studieo <noreply@studieo.com>',
    ...params,
  });
}
```

### Notification Templates

```typescript
// lib/email/templates.ts

export async function sendTeamInvite(params: {
  toEmail: string;
  inviterName: string;
  projectTitle: string;
  applicationId: string;
}) {
  return await sendEmail({
    to: params.toEmail,
    subject: `${params.inviterName} invited you to join a team`,
    html: `
      <p>${params.inviterName} has invited you to join their team for ${params.projectTitle}.</p>
      <a href="${process.env.NEXT_PUBLIC_URL}/applications/${params.applicationId}">View Application</a>
    `,
  });
}

export async function sendApplicationAccepted(params: {
  toEmail: string;
  projectTitle: string;
  companyName: string;
  contactEmail: string;
}) {
  return await sendEmail({
    to: params.toEmail,
    subject: `Your team was accepted for ${params.projectTitle}!`,
    html: `
      <p>Congratulations! Your team was accepted for ${params.projectTitle} at ${params.companyName}.</p>
      <p>Contact: ${params.contactEmail}</p>
    `,
  });
}

export async function sendAdminNotification(params: {
  companyName: string;
  domain: string;
}) {
  return await sendEmail({
    to: 'admin@studieo.com',
    subject: `New Company Signup: ${params.companyName}`,
    html: `
      <p>A new company has signed up and needs vetting:</p>
      <p><strong>${params.companyName}</strong> (${params.domain})</p>
      <p>Please log in to Supabase to review and update their profile.</p>
    `,
  });
}
```

## TypeScript Type Generation

Use Supabase MCP to generate types:

```
"generate TypeScript types from database schema"
```

This creates types matching your database schema for use in TypeScript code.

## Security Advisors

Regularly check for security issues:

```
"get security advisors for the database"
```

This will check for:
- Missing RLS policies
- Publicly accessible tables
- Performance issues

## Next Steps

When working on backend features:
1. **Use Supabase MCP**: Query schema, apply migrations, generate types
2. **Create migrations**: For any schema changes
3. **Add RLS policies**: Enforce least-privilege access
4. **Test with MCP**: Use `execute_sql` to test queries
5. **Implement server actions**: Wire frontend to backend safely
6. **Check advisors**: Run security audit regularly
