# AGENTS.md — Global

## Project Goal

Build **Studieo**: a vetted two-sided marketplace connecting high-performing students from top universities with companies for real-world, project-based work. Ship an MVP with fast, modern UX using Next.js, Supabase, and prebuilt UI components.

## Product Principles

- **Exclusivity & Quality**: Both sides are vetted. Students need valid .edu emails from curated universities. Companies need work emails and manual admin approval.
- **Simplicity**: Intuitive, "just works" experience with clean, modern, fast UI.
- **Action-Oriented**: Frictionless path from project posting to team formation.
- **Speed Over Custom**: Build fast using prebuilt components from shadcn/Aceternity/Animate. Minimize custom components—compose and configure registry components instead.

## Core User Flows

### Students
1. Sign up with .edu email → Email verification → Onboarding (profile, resume upload)
2. Browse open projects → Apply with design doc → Invite team members
3. Manage applications and active projects from dashboard

### Companies
1. Sign up with work email → Auto-link to company by domain OR create new company (pending admin vetting)
2. Post projects with detailed requirements → Review applications → Accept/reject teams
3. Manage multiple projects and track applicants

### Key Constraints
- Students: Max 3 active projects (applied or in-progress) at once
- Companies: Auto-associated by email domain (e.g., user@google.com joins "Google")
- All companies manually vetted by Studieo admin team

## Tech Stack

**Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Aceternity components

**Backend**: Supabase (Postgres + Auth + Storage + RLS)

**Email**: Resend for transactional emails (invites, notifications)

**Testing**: Playwright via MCP for e2e tests

**MCP Servers**: shadcn (UI components), Supabase (DB/schema), Playwright (testing)

## Repository Structure

```
studieo/
├── AGENTS.md                    # This file
├── code/                        # Next.js frontend
│   ├── AGENTS.md               # Frontend-specific guidance
│   ├── app/
│   │   ├── (auth)/             # Auth route group
│   │   │   ├── login/
│   │   │   ├── sign-up/
│   │   │   └── onboarding/
│   │   ├── (student)/          # Student route group
│   │   │   ├── dashboard/
│   │   │   ├── browse/
│   │   │   └── applications/[id]/
│   │   ├── (company)/          # Company route group
│   │   │   ├── dashboard/
│   │   │   └── projects/
│   │   │       ├── new/
│   │   │       └── [id]/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── page.tsx
│   ├── components/
│   │   ├── AGENTS.md           # Component guidelines
│   │   ├── ui/                 # shadcn primitives
│   │   ├── blocks/             # Aceternity blocks
│   │   ├── forms/              # Multi-step forms
│   │   └── shells/             # Layout shells
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts       # SSR client
│   │   │   ├── client.ts       # CSR client
│   │   │   └── middleware.ts
│   │   ├── actions/            # Server actions
│   │   ├── schemas/            # Zod validation
│   │   └── utils.ts
│   ├── components.json         # shadcn config with Aceternity registry
│   └── package.json
├── supabase/
│   ├── AGENTS.md               # Backend-specific guidance
│   ├── migrations/
│   │   ├── 0001_init_schema.sql
│   │   ├── 0002_rls_policies.sql
│   │   └── 0003_storage_buckets.sql
│   └── seed.sql
└── tests/
    └── e2e/
        ├── auth.spec.ts
        ├── onboarding.spec.ts
        └── applications.spec.ts
```

## Core Database Schema

### Key Tables
- `companies`: Company profiles (name, domain, description, sector, vetted status)
- `company_users`: Users associated with companies (auto-linked by email domain)
- `student_profiles`: Student profiles (name, grad_date, resume, interests, bio, application_slots)
- `projects`: Company projects (title, description, skills, team_size, status)
- `applications`: Student team applications (with design doc upload)
- `team_members`: Students on application teams (with invite status)
- `allowed_school_domains`: Whitelist of valid .edu domains

**Note**: `application_slots` on student profiles will support future feature for limited applications (expandable via friend invites). For MVP, set default to 3.

### Key Enums
- `project_status`: INCOMPLETE, OPEN, IN_PROGRESS, COMPLETED, CANCELLED
- `application_status`: PENDING, SUBMITTED, ACCEPTED, REJECTED
- `invite_status`: PENDING, ACCEPTED, DECLINED

## Security & RLS

- **All tables** must have RLS enabled with least-privilege policies
- Students can only see/edit their own profiles and applications
- Companies can only see/edit their own projects and applications to those projects
- Public read-down for OPEN projects (limited fields only)
- All writes via server actions in `code/lib/actions/`
- Never expose service-role keys in client code

## MCP Usage

### shadcn MCP
```
"install button component"
"search for multi-step form"
"preview accordion from Aceternity"
```

### Supabase MCP
```
"list tables in public schema"
"apply migration for projects table"
"generate TypeScript types"
"get security advisors"
```

### Playwright MCP
```
"generate test for student onboarding flow"
"run e2e tests for application submission"
```

## Email Notifications (via Resend)

### To Students
- `team.invite`: Invited to join application team
- `application.accepted`: Team accepted for project (with company contact info)
- `application.rejected`: Application status update

### To Companies
- `project.new_application`: New team applied to project

### To Admins
- `admin.new_company`: New company signup needs vetting

## Definition of Done (per feature)

- [ ] UI components installed via shadcn/Aceternity
- [ ] Server actions implemented in `code/lib/actions/`
- [ ] Database migration applied with RLS policies
- [ ] Storage buckets configured (if needed)
- [ ] Email templates created (if needed)
- [ ] E2E test coverage with Playwright
- [ ] TypeScript types generated from schema
- [ ] Linter errors resolved

## Development Workflow

1. **Start with schema**: Design tables, enums, and RLS policies using Supabase MCP
2. **Build UI**: Install and compose components using shadcn MCP
3. **Wire data**: Create server actions for mutations, use server components for reads
4. **Test flows**: Generate and run e2e tests with Playwright MCP
5. **Iterate**: Fix linter errors, refine policies, improve UX

## Domain-Specific Rules

### Student Email Validation
- Check against `allowed_school_domains` table
- Must end in `.edu`
- Show friendly error: "Sorry, we're not at your school yet."

### Company Email Validation
- Validate using `free-email-domains` package to block free/generic email providers (gmail.com, hotmail.com, etc.)
- Auto-link to existing company by domain match
- If no match, create new company (pending admin vetting) and trigger admin email

### Active Project Limit
- Students can have max 3 projects with status SUBMITTED, ACCEPTED, or IN_PROGRESS
- Enforce in server action before creating new applications

### Team Invites
- Only team lead (application creator) can invite members
- Invites sent via Resend with accept/decline links
- Team members must have valid student profiles

## File Uploads

### Student Resumes
- **Bucket**: `resumes`
- **Access**: Private, signed URLs only
- **Allowed**: PDF, DOC, DOCX
- **Max size**: 5MB

### Application Design Docs
- **Bucket**: `design_docs`
- **Access**: Private, viewable by project owner company
- **Allowed**: PDF, PPT, PPTX, Figma links
- **Max size**: 10MB

## UI/UX Guidelines

- **Compose, Don't Create**: Use registry components as-is. Avoid custom components unless absolutely necessary.
- **Layout**: Use Aceternity's sidebar components for "ChatGPT-style" dashboards
- **Forms**: Use shadcn Form primitives with multi-step logic—don't build custom form components
- **Modals**: Use shadcn Dialog/Sheet components for all overlays
- **Loading**: Use Suspense boundaries for data-fetching components
- **Errors**: Friendly error messages with clear next steps
- **Accessibility**: Follow shadcn patterns for focus management and ARIA labels
- **Testing**: Add `data-testid` to interactive elements for Playwright selectors

### Component Strategy

**DO**:
- Search registries first: "show me sidebar from Aceternity"
- Compose multiple registry components together
- Use shadcn variants/sizes to customize appearance
- Add minimal styling with Tailwind utilities

**DON'T**:
- Build custom components from scratch
- Create wrappers unless absolutely necessary for API stability
- Write custom CSS or animations (use registry patterns)

## Next Steps for AI Agents

When assigned a task:
1. Read the appropriate AGENTS.md file for your domain (frontend, components, or backend)
2. Use MCP tools to discover existing patterns and schemas
3. Implement changes following the established conventions
4. Add tests and verify all checks pass
5. Update relevant AGENTS.md files if you establish new patterns

