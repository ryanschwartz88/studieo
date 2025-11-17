# Studieo

A two-sided marketplace connecting vetted, high-performing students from top-tier universities with companies for real-world, project-based work.

**For Companies:** A pipeline to high-potential talent for flexible, short-term projects.  
**For Students:** A way to gain tangible, real-world experience, build portfolios, and connect with potential employers.

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Resend account for email notifications

### Setup

1. **Clone and install:**
```bash
cd code
pnpm install
```

2. **Configure environment:**
Create `.env.local` in the `code/` directory:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend (for email notifications)
RESEND_API_KEY=your_resend_api_key

# App URL
NEXT_PUBLIC_URL=http://localhost:3000
```

3. **Set up the database:**
```bash
# Apply migrations to your Supabase project
npx supabase db push

# Or manually apply migrations from supabase/migrations/
```

4. **Run the dev server:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **UI Components:** shadcn/ui + Aceternity components (compose, don't create)
- **Backend:** Supabase (Postgres + Auth + Storage + RLS)
- **Email:** Resend for transactional emails
- **Testing:** Playwright via MCP for e2e tests

---

## Project Structure

```
studieo/
├── code/                    # Next.js frontend application
│   ├── app/                # App Router routes
│   │   ├── (auth)/         # Authentication flows
│   │   ├── student/        # Student-only routes
│   │   └── company/        # Company-only routes
│   ├── components/         # UI components (shadcn + Aceternity)
│   ├── lib/                # Utilities, actions, schemas
│   └── package.json
├── supabase/               # Database migrations and config
│   └── migrations/         # SQL migration files
└── tests/                  # E2E tests (Playwright)
```

For detailed architecture guidance, see:
- **`AGENTS.md`** - Global project overview and principles
- **`code/AGENTS.md`** - Frontend architecture and patterns
- **`code/components/AGENTS.md`** - Component composition guidelines
- **`supabase/AGENTS.md`** - Database schema, RLS, and backend logic

---

## Core Features

### User Roles

1. **Student**
   - Must have a valid .edu email from a curated list of universities
   - Can be on max 3 active projects (applied or in-progress) at once
   - Browse projects, apply with teams, manage applications

2. **Company User**
   - Must have a work email (no generic providers like gmail.com)
   - Auto-associated with company by email domain (e.g., user@google.com → "Google")
   - Post projects, review applications, manage teams

3. **Studieo Admin** (Internal)
   - Manually vet company profiles
   - Manage curated list of universities
   - Monitor platform health

### Authentication & Onboarding

**Student Flow:**
- Sign up with .edu email → Domain validation against `allowed_school_domains` table
- Email verification → Multi-step onboarding (name, grad date, resume, interests, bio)
- If domain not allowed: "Sorry, we're not at your school yet."

**Company Flow:**
- Sign up with work email → Block generic providers (gmail, hotmail, etc.)
- Auto-link to existing company by domain OR create new company
- Minimal onboarding (name, role, sector)
- New companies trigger admin email for manual vetting

### Student Dashboard

- **Sidebar:** Lists active projects and applications
- **Main View:** Browse projects with search and filters
- **Project Page:** Read-only view with "Apply" button
- **Application Flow:**
  1. Click "Apply" → Creates application (status: PENDING)
  2. Upload design doc (required)
  3. Invite team members by .edu email
  4. Submit application → Status changes to SUBMITTED

### Company Dashboard

- **Layout:** ChatGPT-style sidebar with main content area
- **Sidebar:** "Add New Project" button + projects grouped by status
- **Main View:** Dashboard stats (open projects, pending applications, total applicants)
- **Project Management:**
  - Create/edit projects with multi-step form
  - Save as draft (INCOMPLETE) or publish (OPEN)
  - View applicants, review design docs, accept/reject teams

### Application Management

**Company View:**
- Project page with two tabs: Project Info (editable) and Applicants
- View submitted applications with team details, design docs, and answers
- Accept/reject buttons → Updates status and notifies team

**Student View:**
- Application page shows team members, invite status, and submission state
- Team leads can invite members (sends Resend email)
- Invited students see invites on dashboard and can accept/decline

### Settings & Profiles

- **User Profile Modal:** Edit personal info (students: profile fields, companies: name/role)
- **Company Settings Modal:** Edit shared company profile (name, website, description)
- Shows read-only list of all users associated with company domain

### Email Notifications (Resend)

**To Students:**
- `team.invite` - Invited to join application team
- `application.accepted` - Team accepted for project (with contact info)
- `application.rejected` - Application status update

**To Companies:**
- `project.new_application` - New team applied to project

**To Admins:**
- `admin.new_company` - New company signup needs vetting

---

## Key Constraints & Business Logic

- **Student Project Limit:** Max 3 active projects (status: SUBMITTED, ACCEPTED, or IN_PROGRESS)
- **Company Auto-Linking:** Users automatically join company by email domain
- **Manual Vetting:** All companies must be manually approved by Studieo admin team
- **File Uploads:**
  - Resumes: `resumes` bucket (PDF, DOC, DOCX, max 5MB)
  - Design Docs: `design_docs` bucket (PDF, PPT, PPTX, Figma links, max 10MB)

---

## Development Guidelines

### Component Strategy

**DO:**
- Search registries first (shadcn/Aceternity)
- Compose multiple registry components together
- Use variants/sizes to customize appearance
- Add minimal styling with Tailwind utilities

**DON'T:**
- Build custom components from scratch
- Create wrappers unless absolutely necessary
- Write custom CSS or animations (use registry patterns)

### Data Flow

- **Reads:** Server Components with Supabase SSR client
- **Mutations:** Server Actions in `code/lib/actions/`
- **Validation:** Zod schemas in `code/lib/schemas/`
- **Security:** RLS policies on all tables, never expose service-role keys

### Testing

- E2E tests in `tests/e2e/` using Playwright via MCP
- Add `data-testid` attributes to interactive elements for selectors

---

## Database Schema Overview

**Key Tables:**
- `companies` - Company profiles (name, domain, description, sector, vetted status)
- `company_users` - Users associated with companies (auto-linked by email domain)
- `student_profiles` - Student profiles (name, grad_date, resume, interests, bio)
- `projects` - Company projects (title, description, skills, team_size, status)
- `applications` - Student team applications (with design doc upload)
- `team_members` - Students on application teams (with invite status)
- `allowed_school_domains` - Whitelist of valid .edu domains

**Key Enums:**
- `project_status`: INCOMPLETE, OPEN, IN_PROGRESS, COMPLETED, CANCELLED
- `application_status`: PENDING, SUBMITTED, ACCEPTED, REJECTED
- `invite_status`: PENDING, ACCEPTED, DECLINED

All tables have RLS enabled with least-privilege policies. See `supabase/AGENTS.md` for detailed schema documentation.

---

## Getting Help

- **Architecture Questions:** Check the `AGENTS.md` files in relevant directories
- **Component Questions:** See `code/components/AGENTS.md` for composition patterns
- **Database Questions:** See `supabase/AGENTS.md` for schema and RLS details
- **Brand/Design:** See `BRAND.md` for design system guidelines

---

## Contact

Ryan Schwartz  
Last Updated: October 31, 2025
