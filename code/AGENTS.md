# code/AGENTS.md — Frontend

This file provides guidance for building the Next.js frontend for Studieo.

## Purpose

The frontend is responsible for:
- User authentication and onboarding flows
- Student project browsing and application management
- Company project posting and applicant review
- File uploads (resumes, design docs)
- Real-time UI updates and notifications

## MVP Philosophy: Speed Through Composition

**Build fast by composing registry components, not creating custom ones.**

### Core Principle
- **Search → Install → Compose**: Find prebuilt components, install them, wire data
- **No Custom Components**: Unless registry has nothing suitable (rare)
- **Configuration Over Creation**: Use variants, props, and Tailwind to customize

### Example: Project Card
```typescript
// ❌ DON'T: Create custom ProjectCard component
// components/project-card.tsx

// ✅ DO: Compose shadcn Card in the page directly
<Card className="cursor-pointer hover:shadow-lg">
  <CardHeader>
    <CardTitle>{project.title}</CardTitle>
    <CardDescription>{project.company_name}</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">{project.summary}</p>
    <div className="flex gap-2 mt-4">
      {project.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
    </div>
  </CardContent>
</Card>
```

### Example: Sidebar Layout
```typescript
// ❌ DON'T: Build custom sidebar component
// ✅ DO: Use Aceternity's Sidebar component directly

"install sidebar from Aceternity"
// Then in app/(student)/layout.tsx:
import { Sidebar } from '@/components/ui/sidebar';

<Sidebar
  items={[
    { label: 'Browse Projects', href: '/browse' },
    { label: 'My Applications', href: '/applications' },
  ]}
>
  {children}
</Sidebar>
```

## Routing & Pages

### Route Groups

Use Next.js App Router with route groups to organize by user role:

#### `(auth)/` — Authentication flows
- `/login` — Sign in for both students and companies
- `/sign-up` — Sign up with email validation
- `/onboarding` — Multi-step profile creation (role-specific)
  - Students: name, grad_date, resume, interests, bio
  - Companies: name, role, sector
- `/forgot-password` — Password reset flow
- `/update-password` — Password change after reset

#### `(student)/` — Student-only routes
- `/dashboard` — Overview of applications and active projects
- `/browse` — Main project discovery page with search/filters
- `/browse/[projectId]` — Full project details with "Apply" button
- `/applications/[id]` — Application builder (design doc, team invites, submit)
- `/profile` — Edit student profile

#### `(company)/` — Company-only routes
- `/dashboard` — Overview of projects and pending applications
- `/projects/new` — Multi-step project creation form
- `/projects/[id]` — Two tabs: "Edit Project" and "View Applicants"
- `/projects/[id]/applicants/[applicationId]` — Full application details with accept/reject
- `/settings` — Company profile settings

### Layout Strategy

- **Root layout** (`app/layout.tsx`): Global providers, fonts, theme
- **Auth layout** (`app/(auth)/layout.tsx`): Centered card layout, no sidebar
- **Student layout** (`app/(student)/layout.tsx`): Sidebar with "My Applications" and "Active Projects"
- **Company layout** (`app/(company)/layout.tsx`): Sidebar with "Projects" grouped by status

### Shared Components Strategy

**Minimize `components/` directory**:
- Keep `ui/` for shadcn auto-generated primitives only
- Keep `blocks/` for Aceternity auto-installed blocks only
- **No** `forms/`, `shells/`, or custom domain components
- Compose registry components directly in page files
- If you repeat the same composition 3+ times, only then consider extracting

## Data Fetching & Server Actions

### Server Components (Reads)

Use `lib/supabase/server.ts` for all data reads in server components:

```typescript
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('status', 'OPEN');
  
  return <ProjectList projects={projects} />;
}
```

### Server Actions (Writes)

All mutations must go through server actions in `lib/actions/`:

```typescript
// lib/actions/applications.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitApplication(applicationId: string) {
  const supabase = await createClient();
  
  // Update application status (RLS will enforce team lead authorization)
  const { error } = await supabase
    .from('applications')
    .update({ 
      status: 'SUBMITTED',
      submitted_at: new Date().toISOString()
    })
    .eq('id', applicationId);
  
  if (error) throw error;
  
  revalidatePath('/applications');
  return { success: true };
}
```

### Key Server Actions to Implement

**Note**: The `handle_new_user()` trigger auto-creates users and student profiles, so sign-up logic should be simpler.

- `lib/actions/auth.ts`: `signUpStudent`, `signUpCompany`, `signIn`, `signOut`
- `lib/actions/students.ts`: `completeStudentProfile`, `updateProfile`, `uploadResume`
- `lib/actions/companies.ts`: `updateCompany` (creation handled by trigger)
- `lib/actions/projects.ts`: `createProject`, `updateProject`, `publishProject`, `saveProject`
- `lib/actions/applications.ts`: `createApplication`, `submitApplication`, `acceptApplication`, `rejectApplication`
- `lib/actions/teams.ts`: `inviteTeamMember`, `acceptInvite`, `declineInvite`

## Authentication & Authorization

### Domain-Specific Rules

#### Student Sign-Up Flow
1. User enters email
2. Check `allowed_school_domains` table (must end in `.edu` and be in whitelist)
3. If invalid: Show error "Sorry, we're not at your school yet."
4. If valid: Send confirmation email → Redirect to student onboarding

#### Company Sign-Up Flow
1. User enters email
2. Validate email is not from a free/generic provider (using `free-email-domains` package to reject gmail.com, hotmail.com, etc.)
3. Supabase Auth creates account
4. `handle_new_user()` trigger automatically:
   - Extracts domain from email
   - Checks if company exists for that domain
   - If yes: Links user to existing company
   - If no: Creates shell company record and sends admin notification email
5. User redirected to company dashboard (may show "pending admin approval" banner if new company)

### Protected Routes

Use middleware (`middleware.ts`) to enforce authentication:

```typescript
// middleware.ts
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: Request) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/(student)/:path*',
    '/(company)/:path*',
  ],
};
```

### Role-Based Access

Check user role in layouts using the `users` table:

```typescript
// app/(student)/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function StudentLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  // Check user role from users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (userData?.role !== 'STUDENT') redirect('/');
  
  // Check if student profile is complete
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!profile || !profile.grad_date) redirect('/onboarding');
  
  return <>{children}</>;
}
```

## UI Components & Styling

### Component Libraries (PRIMARY TOOLS)

- **shadcn/ui**: Core primitives (Button, Input, Form, Dialog, Tabs, Card, Badge, Sheet, Sidebar)
- **Aceternity UI**: Sidebar, hero sections, animated cards, timeline components
- **Animate UI**: Motion primitives for transitions

### Installation Pattern (YOUR FIRST STEP)

```bash
# Always search registries FIRST before writing any component code
"search for sidebar component"
"show me modal dialog from shadcn"
"preview multi-step form component"
"find file upload from Aceternity"
"install button, card, dialog, and tabs from shadcn"
```

### Enforcement Rules (read before shipping UI)

- Always compose from shadcn/Aceternity/Animate components. Do not hand-roll primitives.
- Containers: auth/forms `max-w-2xl`, dashboards `max-w-6xl`, spacing `space-y-6`.
- Motion defaults: 150–250ms, ease-out; respect `prefers-reduced-motion`.
- Inputs height `h-11`; use shadcn `Form` + Zod + RHF.
- Feedback: use `Alert` for inline errors and `sonner` toasts for actions.
- Navigation: use shadcn `Sidebar`, `DropdownMenu`, `Tabs`, `Breadcrumb`.
- Date inputs: use shadcn `Calendar` centered with `mx-auto`.
- Backgrounds: subtle animated gradient only on `(auth)`; dashboards stay plain.
- Testing: add `data-testid` to all interactive elements.

### Auth Page Pattern (Simplistic + Animated)

```
<Image src="/Studieo Logo/Full Logo.svg" ... />
<Button variant="outline">Continue with Google</Button>
<div className="text-xs text-muted-foreground text-center">or</div>
<Input className="h-11" />
<Input type="password" className="h-11" />
```

Notes:
- Keep copy minimal (no “what happens next”).
- Email verification is required before onboarding; redirect to `/auth/verify-email` after sign-up.

### Onboarding Theme Picker Pattern

```
// Step 0
<div className="grid sm:grid-cols-2 gap-4">
  <button className="rounded-lg border p-6 hover:border-primary">Light</button>
  <button className="rounded-lg border p-6 hover:border-primary">Dark</button>
</div>
```

Rules:
- Boxless content; progress at top; Back hidden on first step.

### Component Structure (Minimal)

```
components/
├── ui/              # shadcn primitives (auto-installed)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── sidebar.tsx
│   └── ...
└── blocks/          # Aceternity blocks (auto-installed)
    ├── sidebar.tsx  # If different from shadcn
    └── ...
```

**That's it.** Compose these directly in your page files.

### Form Patterns (Compose, Don't Create)

**Define schema** in `lib/schemas/`:
```typescript
// lib/schemas/student.ts
import { z } from 'zod';

export const studentOnboardingSchema = z.object({
  full_name: z.string().min(2),
  grad_date: z.date(),
  resume: z.instanceof(File).optional(),
  interests: z.array(z.string()),
  bio: z.string().max(500),
});
```

**Build form INLINE in page** (no separate component file):
```typescript
// app/(auth)/onboarding/page.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentOnboardingSchema } from '@/lib/schemas/student';
import { createStudentProfile } from '@/lib/actions/students';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const form = useForm({
    resolver: zodResolver(studentOnboardingSchema),
  });
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(createStudentProfile)}>
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Complete Profile</Button>
      </form>
    </Form>
  );
}
```

No `components/forms/` directory needed.

### File Uploads

Use Supabase Storage with signed URLs. Storage paths are strictly enforced by RLS:

```typescript
// lib/actions/students.ts
'use server';

import { createClient } from '@/lib/supabase/server';

export async function uploadResume(file: File) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error('Not authenticated');
  
  // Path must be {user_id}/resume.pdf (enforced by RLS)
  const filePath = `${user.id}/resume.pdf`;
  
  const { error } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true, // Replace existing resume
    });
  
  if (error) throw error;
  
  // Update student profile with resume path
  await supabase
    .from('student_profiles')
    .update({ resume_url: `resumes/${filePath}` })
    .eq('user_id', user.id);
  
  return { filePath };
}

export async function getResumeUrl(userId: string) {
  const supabase = await createClient();
  
  const { data } = await supabase.storage
    .from('resumes')
    .createSignedUrl(`${userId}/resume.pdf`, 3600); // 1 hour
  
  return data?.signedUrl;
}
```

## Key Features Implementation

### 1. Student Project Browsing (`/browse`)

**Requirements**:
- Display all projects with status `OPEN`
- Search by title, company name
- Filter by project_type, skills_needed, sector
- Cards show: title, company name, summary, team_size, skills (badges)

**Implementation** (compose registry components):
```typescript
// app/(student)/browse/page.tsx
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';

export default async function BrowsePage() {
  const projects = await getOpenProjects();
  
  return (
    <div>
      <div className="flex gap-4 mb-6">
        <Input placeholder="Search projects..." />
        <Select>
          <SelectTrigger>Project Type</SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="engineering">Engineering</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {projects.map(project => (
          <Card key={project.id} className="cursor-pointer hover:shadow-lg">
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.company_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{project.summary}</p>
              <div className="flex gap-2 mt-4">
                {project.skills.map(skill => <Badge key={skill}>{skill}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

No custom components needed—compose shadcn primitives directly.

### 2. Application Builder (`/applications/[id]`)

**Requirements**:
- Upload design doc (required)
- Answer optional questions from project
- Invite team members by email (send Resend emails)
- Show team members with invite status (Pending/Accepted)
- Submit button (changes status to SUBMITTED)

**Implementation** (use shadcn Form, Input, Button):
```typescript
// app/(student)/applications/[id]/page.tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { uploadDesignDoc, inviteTeamMember, submitApplication } from '@/lib/actions/applications';

export default async function ApplicationPage({ params }) {
  const application = await getApplication(params.id);
  const teamMembers = await getTeamMembers(params.id);
  
  return (
    <div className="space-y-6">
      <div>
        <Label>Design Document</Label>
        <Input type="file" accept=".pdf,.pptx" />
      </div>
      
      <div>
        <Label>Invite Team Member</Label>
        <div className="flex gap-2">
          <Input type="email" placeholder="teammate@stanford.edu" />
          <Button>Send Invite</Button>
        </div>
      </div>
      
      <div>
        <h3>Team Members</h3>
        {teamMembers.map(member => (
          <div key={member.id} className="flex items-center gap-2">
            <span>{member.name}</span>
            <Badge>{member.invite_status}</Badge>
          </div>
        ))}
      </div>
      
      <Button onClick={() => submitApplication(params.id)}>
        Submit Application
      </Button>
    </div>
  );
}
```

Compose shadcn primitives inline. No custom components.

### 3. Company Applicant Review (`/projects/[id]`)

**Requirements**:
- Tab 1: Edit project details
- Tab 2: List all applications with status SUBMITTED
- Click application to view modal with:
  - Team members (links to profiles/resumes)
  - Design doc download link
  - Answers to questions
  - Accept/Reject buttons

**Implementation** (use shadcn Tabs, Dialog, Table):
```typescript
// app/(company)/projects/[id]/page.tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default async function ProjectPage({ params }) {
  const project = await getProject(params.id);
  const applications = await getApplications(params.id);
  
  return (
    <Tabs defaultValue="applicants">
      <TabsList>
        <TabsTrigger value="edit">Edit Project</TabsTrigger>
        <TabsTrigger value="applicants">Applicants</TabsTrigger>
      </TabsList>
      
      <TabsContent value="edit">
        {/* Edit form here */}
      </TabsContent>
      
      <TabsContent value="applicants">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Lead</TableHead>
              <TableHead>Team Size</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map(app => (
              <TableRow key={app.id}>
                <TableCell>{app.team_lead_name}</TableCell>
                <TableCell>{app.team_size}</TableCell>
                <TableCell>{app.submitted_at}</TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">View</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Application Details</DialogTitle>
                      </DialogHeader>
                      {/* Team members, design doc, etc. */}
                      <div className="flex gap-2">
                        <Button onClick={() => acceptApplication(app.id)}>Accept</Button>
                        <Button variant="destructive" onClick={() => rejectApplication(app.id)}>Reject</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
```

Use shadcn's Dialog for modals, Tabs for navigation, Table for lists.

### 4. Multi-Step Forms

Use React state + shadcn primitives inline:

```typescript
// app/(auth)/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const totalSteps = 3;
  
  return (
    <div className="space-y-6">
      <Progress value={(step / totalSteps) * 100} />
      
      {step === 0 && <div>{/* Step 1: Name, grad date */}</div>}
      {step === 1 && <div>{/* Step 2: Resume upload */}</div>}
      {step === 2 && <div>{/* Step 3: Bio, interests */}</div>}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
          Back
        </Button>
        <Button onClick={() => step === totalSteps - 1 ? handleSubmit() : setStep(step + 1)}>
          {step === totalSteps - 1 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
```

No wrapper component needed—manage state directly in page.

## Sidebar Layouts (Use Aceternity)

**DO NOT build custom sidebar.** Use Aceternity's Sidebar component:

```
"install sidebar from Aceternity"
```

Then configure in layout:

```typescript
// app/(student)/layout.tsx
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/sidebar';

export default async function StudentLayout({ children }) {
  const applications = await getStudentApplications();
  
  return (
    <Sidebar>
      <SidebarBody>
        <SidebarLink href="/browse" icon={<SearchIcon />}>
          Browse Projects
        </SidebarLink>
        
        <div className="text-xs text-muted-foreground mt-4">MY APPLICATIONS</div>
        {applications.pending.map(app => (
          <SidebarLink key={app.id} href={`/applications/${app.id}`}>
            {app.project_title}
          </SidebarLink>
        ))}
        
        <div className="text-xs text-muted-foreground mt-4">ACTIVE PROJECTS</div>
        {applications.active.map(app => (
          <SidebarLink key={app.id} href={`/applications/${app.id}`}>
            {app.project_title}
          </SidebarLink>
        ))}
        
        <SidebarLink href="/profile" icon={<SettingsIcon />} className="mt-auto">
          Settings
        </SidebarLink>
      </SidebarBody>
    </Sidebar>
  );
}
```

Same pattern for company sidebar—use Aceternity's Sidebar, don't build custom.

## Testing Readiness

### Playwright Test Attributes

Add `data-testid` to all interactive elements:

```tsx
<Button data-testid="submit-application">Submit</Button>
<Input data-testid="project-title" />
```

### Test Coverage Goals

- Auth flows: Sign up, login, email validation
- Student onboarding: Profile creation, resume upload
- Company onboarding: Auto-linking, new company creation
- Project creation: Multi-step form, publish
- Applications: Create, invite team, submit
- Applicant review: View, accept, reject

Use Playwright MCP: `"generate test for student application submission flow"`

## Styling Guidelines

- Use Tailwind utility classes
- Follow shadcn design tokens (e.g., `bg-background`, `text-foreground`)
- Maintain consistent spacing (4px/8px/16px/24px grid)
- Use `lucide-react` icons consistently
- Prefer `next-themes` for dark mode support

## Error Handling

- Wrap server actions in try/catch
- Return structured errors: `{ error: string }` or `{ success: boolean, data?: T }`
- Show toast notifications for user feedback (install `sonner` via shadcn)
- Use `error.tsx` for route-level error boundaries
- Add `loading.tsx` for suspense fallbacks

## Performance

- Use `next/image` for all images
- Implement `loading.tsx` for data-fetching routes
- Lazy load heavy components (Aceternity animations)
- Paginate long lists (projects, applications)
- Cache expensive queries with `unstable_cache`

## Accessibility

- Use semantic HTML (`nav`, `main`, `section`)
- Ensure keyboard navigation works (focus states)
- Add ARIA labels to icon-only buttons
- Maintain color contrast ratios (WCAG AA)
- Test with screen readers

## Next Steps

When building a new feature:
1. **Design the route** — Determine URL structure and route group
2. **Identify data needs** — What tables/queries are required?
3. **Install UI components** — Use shadcn MCP to find and preview
4. **Build the page** — Server component for reads, client components for interactivity
5. **Create server actions** — Implement mutations with validation
6. **Add tests** — Use Playwright MCP to generate e2e coverage
7. **Refine UX** — Loading states, errors, accessibility

