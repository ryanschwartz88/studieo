# Studieo Platform

The platform application for Studieo - connecting elite student teams with companies for real-world projects.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Resend account for email notifications

### Environment Setup

Create a `.env.local` file in the `code/` directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (for email notifications)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_URL=http://localhost:3000
```

### Installation

```bash
cd code
pnpm install
```

### Database Setup

1. **Apply migrations** to your Supabase project:

```bash
# Using Supabase CLI
npx supabase db push

# Or manually apply migrations from supabase/migrations/ directory
```

2. **Verify schema** using Supabase MCP or dashboard:
   - Check that all tables exist (users, companies, student_profiles, projects, applications, team_members, saved_projects, allowed_school_domains)
   - Verify RLS policies are enabled
   - Check that storage buckets (resumes, design_docs) are created

3. **Seed university data** (if not already done by migration):
   - The `allowed_school_domains` table should contain approved universities
   - Check `supabase/migrations/20250101000000_add_allowed_school_domains.sql`

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the platform.

**Note**: The root path redirects to https://www.studieo.com for non-authenticated users. Authenticated users are redirected based on their role (students to `/browse`, companies to `/dashboard`).

## Project Structure

```
code/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── onboarding/
│   │   └── forgot-password/
│   ├── (student)/           # Student-only routes
│   │   ├── browse/
│   │   ├── dashboard/
│   │   ├── applications/[id]/
│   │   └── profile/
│   ├── (company)/           # Company-only routes
│   │   ├── dashboard/
│   │   └── projects/
│   │       ├── new/
│   │       └── [id]/
│   ├── layout.tsx           # Root layout with brand metadata
│   ├── globals.css          # Global styles (Tailwind)
│   └── page.tsx             # Landing redirect logic
├── components/
│   ├── ui/                  # shadcn primitives (auto-installed)
│   ├── blocks/              # Aceternity blocks (auto-installed)
│   ├── theme-switcher.tsx
│   └── logout-button.tsx
├── lib/
│   ├── actions/             # Server actions for mutations
│   ├── schemas/             # Zod validation schemas
│   ├── email/               # Email templates (Resend)
│   ├── supabase/            # Supabase client utilities
│   │   ├── server.ts        # SSR client
│   │   ├── client.ts        # CSR client
│   │   └── middleware.ts    # Auth middleware
│   └── utils.ts             # Shared utilities
├── components.json          # shadcn + Aceternity config
└── package.json
```

## Development Guidelines

### AGENTS.md Files

This project uses AGENTS.md files to guide AI agents and developers:

- **`/AGENTS.md`**: Global project overview and principles
- **`/BRAND.md`**: Brand guidelines and design system
- **`code/AGENTS.md`**: Frontend architecture and patterns
- **`code/components/AGENTS.md`**: Component composition guidelines
- **`supabase/AGENTS.md`**: Database schema, RLS, and backend logic

**Read these files before making changes** to understand the architecture and conventions.

### Key Principles

1. **Speed Through Composition**: Build with prebuilt components from shadcn/ui and Aceternity, not custom components
2. **Server Actions for Mutations**: All data writes go through `lib/actions/` server actions
3. **RLS for Authorization**: Rely on Supabase RLS policies, not application-level checks
4. **Minimal Custom Components**: Compose registry components directly in pages

### Installing UI Components

Use shadcn MCP or CLI:

```bash
# Via CLI
npx shadcn@latest add button card dialog tabs table

# Via MCP (in Cursor)
"install button and card from shadcn"
"preview sidebar from Aceternity"
```

### Creating Server Actions

```typescript
// lib/actions/example.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function exampleAction(data: FormData) {
  const supabase = await createClient();
  
  // RLS policies enforce authorization
  const { error } = await supabase
    .from('table_name')
    .insert({ ... });
  
  if (error) throw error;
  
  revalidatePath('/path');
  return { success: true };
}
```

### Database Queries

- **Reads**: Use `createClient()` from `@/lib/supabase/server` in server components
- **Writes**: Always use server actions (never direct mutations in components)
- **Client-side**: Use `createClient()` from `@/lib/supabase/client` only for real-time subscriptions

### File Uploads

Storage paths are enforced by RLS:
- **Resumes**: `{user_id}/resume.pdf`
- **Design Docs**: `{application_id}/design_doc.pdf`

Always use signed URLs for file access.

## Testing

E2E tests with Playwright (via MCP):

```bash
# Install Playwright
pnpm install @playwright/test

# Run tests
pnpm test:e2e
```

Use `data-testid` attributes for reliable selectors:

```tsx
<Button data-testid="submit-application">Submit</Button>
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to `main`

### Environment Variables

Ensure all variables from `.env.local` are set in your deployment environment:
- Supabase URL and keys
- Resend API key
- Public URL

## Common Tasks

### Adding a New University

1. Use Supabase dashboard or SQL editor:

```sql
INSERT INTO public.allowed_school_domains (domain, school_name)
VALUES ('university.edu', 'University Name');
```

### Vetting a New Company

1. Find the company in Supabase dashboard (`companies` table)
2. Update fields: `sector`, `website`, `description`
3. Company users can now see full functionality

### Checking RLS Policies

Use Supabase MCP:

```
"get security advisors for the database"
```

Or manually check RLS status:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Troubleshooting

### "User not found" errors
- Check that `handle_new_user()` trigger is active
- Verify user exists in both `auth.users` and `public.users`

### RLS policy blocks legitimate access
- Test policies using `auth.uid()` in SQL editor
- Check that user's role matches the policy expectations

### File upload fails
- Verify storage bucket exists and has correct RLS policies
- Check file path matches expected format (`{user_id}/...` or `{application_id}/...`)

### Email notifications not sending
- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for delivery status

## Resources

- **Design Doc**: See `/README.md` for complete product requirements
- **Brand Guidelines**: See `/BRAND.md` for design system
- **Supabase Docs**: https://supabase.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Aceternity UI**: https://ui.aceternity.com
- **Next.js Docs**: https://nextjs.org/docs

## Support

For questions or issues:
- **Internal**: Check AGENTS.md files first
- **Supabase**: Use Supabase MCP or documentation
- **UI Components**: Search shadcn/Aceternity registries with MCP
