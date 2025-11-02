# code/components/AGENTS.md — Component Guidelines

This file provides standards for installing, structuring, and composing UI components for Studieo.

## Purpose

The `components/` directory should be **minimal**. It contains ONLY auto-installed registry components. This guide ensures you compose registry components directly in pages rather than creating custom wrapper components.

## MVP Philosophy: Zero Custom Components

**Your goal: Keep `components/` as small as possible.**

- `components/ui/` — Auto-generated shadcn primitives (Button, Input, Card, Dialog, etc.)
- `components/blocks/` — Auto-installed Aceternity components (Sidebar, Hero, etc.)
- **Nothing else** unless you compose the same pattern 5+ times

If you think you need a custom component, **search registries first**:
```
"search for [component name] in shadcn"
"find [pattern] in Aceternity"
"show me [feature] component from Animate"
```

## Component Structure (Minimal)

```
components/
├── ui/                        # shadcn primitives (auto-installed only)
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── tabs.tsx
│   ├── badge.tsx
│   ├── sidebar.tsx
│   ├── table.tsx
│   ├── progress.tsx
│   └── ...
└── blocks/                    # Aceternity blocks (auto-installed only)
    ├── sidebar.tsx            # If different from shadcn
    └── ...
```

**That's it.** No `forms/`, `shells/`, or domain-specific component files.

If you find yourself creating files outside `ui/` or `blocks/`, **STOP** and ask:
1. Is there a registry component that does this?
2. Can I compose primitives directly in the page?
3. Have I repeated this exact pattern 5+ times?

Only proceed if all 3 answers are: No, No, Yes.

## Component Registries

### shadcn/ui (Primary Registry)

**Use for**: Core primitives, form elements, navigation, overlays

**Installation**: Use shadcn MCP

```
"install button component"
"search for multi-step form"
"add dialog and tabs components"
```

**Location**: Auto-installed to `components/ui/`

**Common Components**:
- `Button`, `Input`, `Label`, `Checkbox`, `RadioGroup`
- `Form`, `Select`, `Textarea`, `Switch`
- `Dialog`, `Sheet`, `Popover`, `Tooltip`
- `Card`, `Badge`, `Avatar`, `Separator`
- `Table`, `Tabs`, `Accordion`

### Aceternity UI (Secondary Registry)

**Use for**: Hero sections, animated blocks, advanced layouts

**Installation**: Via shadcn MCP with registry prefix

```
"preview hero section from Aceternity"
"install animated card from Aceternity"
```

**Location**: Manually place in `components/blocks/` and wrap

**Common Blocks**:
- Hero sections with animations
- Timeline components
- Animated cards and backgrounds
- Spotlight effects

### Wrapping External Blocks (Avoid Unless Necessary)

**Default: Use registry components directly without wrappers.**

```typescript
// ✅ DO: Use Aceternity components as-is
import { Sidebar } from '@/components/ui/sidebar';

<Sidebar items={links}>{children}</Sidebar>

// ❌ DON'T: Create wrapper component
// components/app-sidebar.tsx
export function AppSidebar({ children }) {
  return <Sidebar>{children}</Sidebar>;
}
```

**Only create a wrapper if**:
1. The component API is genuinely unstable
2. You need to add app-wide default props
3. You're using the component in 5+ places with the same config

For MVP: **Skip wrappers. Use components directly.**

## Component Categories

### 1. Primitives (`ui/`)

**Purpose**: Low-level building blocks with no business logic

**Characteristics**:
- Accept only UI-related props (variant, size, disabled)
- No data fetching or server actions
- Fully controlled (state managed by parent)
- Highly reusable

**Example**:
```typescript
// components/ui/button.tsx (shadcn)
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function Button({ variant = 'default', size = 'default', ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }))} {...props} />;
}
```

### 2. Blocks (`blocks/`)

**Purpose**: Pre-designed, complex UI patterns (usually animated)

**Characteristics**:
- Often from external registries (Aceternity)
- May include animations and complex layouts
- Should be wrapped for stability
- Used for landing pages, hero sections, etc.

### 3. Forms (`forms/`)

**Purpose**: Multi-step or domain-specific forms

**Characteristics**:
- Built with `react-hook-form` + `zod`
- Use shadcn `Form` components
- Handle validation and submission
- Call server actions for mutations

**Example**:
```typescript
// components/forms/student-onboarding-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentOnboardingSchema, type StudentOnboarding } from '@/lib/schemas/student';
import { createStudentProfile } from '@/lib/actions/students';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function StudentOnboardingForm() {
  const form = useForm<StudentOnboarding>({
    resolver: zodResolver(studentOnboardingSchema),
  });

  async function onSubmit(data: StudentOnboarding) {
    const result = await createStudentProfile(data);
    if (result.success) {
      // Redirect or show success
    } else {
      form.setError('root', { message: result.error });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input {...field} data-testid="student-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit" data-testid="submit-onboarding">
          Complete Profile
        </Button>
      </form>
    </Form>
  );
}
```

### 4. Shells (`shells/`)

**Purpose**: Layout wrappers for common page structures

**Characteristics**:
- Accept children and sidebar content
- Handle responsive behavior
- Provide consistent spacing and structure

**Example**:
```typescript
// components/shells/dashboard-shell.tsx
import { ReactNode } from 'react';

interface DashboardShellProps {
  children: ReactNode;
  sidebar: ReactNode;
  title?: string;
}

export function DashboardShell({ children, sidebar, title }: DashboardShellProps) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r bg-muted/50 overflow-auto">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto">
        {title && (
          <header className="border-b px-6 py-4">
            <h1 className="text-2xl font-bold">{title}</h1>
          </header>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### 5. Domain "Components" (Inline Composition)

**DON'T create domain-specific component files.**

Instead of `components/project-card.tsx`, compose directly in the page:

```typescript
// app/(student)/browse/page.tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function BrowsePage() {
  const projects = await getOpenProjects();
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map(project => (
        <Card
          key={project.id}
          className="cursor-pointer hover:shadow-lg"
          data-testid={`project-card-${project.id}`}
        >
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
            <CardDescription>{project.company_name}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{project.summary}</p>
            <div className="flex gap-2 mt-4">
              {project.skills_needed.map(skill => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <p className="text-sm mt-4">Team size: {project.team_size}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Benefits**:
- Fewer files to maintain
- Direct data flow (no prop drilling)
- Faster iteration (edit in place)
- Less abstraction = clearer code

Only extract if you use this EXACT pattern 5+ times.

## Props & State Management

### Controlled Components

All interactive components should be **controlled** (state managed by parent):

```typescript
// ✅ Good: Controlled
<Input value={value} onChange={(e) => setValue(e.target.value)} />

// ❌ Bad: Uncontrolled
<Input defaultValue={value} />
```

### Callback Props

Use TypeScript for callback prop types:

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}
```

### Server Actions

Forms should call server actions and handle responses:

```typescript
async function onSubmit(data: FormData) {
  const result = await createProject(data);
  
  if (result.success) {
    toast.success('Project created!');
    router.push(`/projects/${result.data.id}`);
  } else {
    toast.error(result.error);
  }
}
```

## Validation with Zod

Define schemas in `lib/schemas/`:

```typescript
// lib/schemas/project.ts
import { z } from 'zod';

export const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  summary: z.string().max(200, 'Summary must be under 200 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  project_type: z.enum(['DESIGN', 'ENGINEERING', 'MARKETING', 'RESEARCH', 'OTHER']),
  skills_needed: z.array(z.string()).min(1, 'Select at least one skill'),
  team_size: z.number().min(1).max(10),
  time_range: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

export type ProjectInput = z.infer<typeof projectSchema>;
```

Use with `react-hook-form`:

```typescript
const form = useForm<ProjectInput>({
  resolver: zodResolver(projectSchema),
  defaultValues: {
    team_size: 3,
  },
});
```

## File Upload Components

### Resume Upload (Students)

```typescript
// components/file-upload.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadResume } from '@/lib/actions/students';

interface FileUploadProps {
  onUploadComplete: (fileName: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}

export function FileUpload({ onUploadComplete, accept = '.pdf,.doc,.docx', maxSize = 5 }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File must be under ${maxSize}MB`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadResume(file);
      onUploadComplete(result.fileName);
    } catch (err) {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept={accept}
        onChange={handleUpload}
        disabled={uploading}
        data-testid="file-upload-input"
      />
      {uploading && <p>Uploading...</p>}
      {error && <p className="text-destructive">{error}</p>}
    </div>
  );
}
```

## Motion & Animations

### Prefer Libraries Over Custom CSS

Use Aceternity components or `framer-motion` for animations:

```typescript
// ✅ Good: Use Aceternity's AnimatedCard
import { AnimatedCard } from '@/components/blocks/animated-card';

// ❌ Bad: Hand-rolling animations
<div className="animate-fade-in">...</div>
```

### Performance Considerations

- Lazy load heavy animated components
- Use `loading="lazy"` for images
- Avoid animating expensive properties (width, height)

## Testing Attributes

### Always Add `data-testid`

For Playwright MCP to generate reliable selectors:

```typescript
<Button data-testid="submit-application">Submit</Button>
<Input data-testid="project-title" placeholder="Enter title" />
<Card data-testid={`project-card-${project.id}`}>...</Card>
```

### Use Semantic HTML

Prefer native elements for better accessibility and testability:

```typescript
// ✅ Good
<nav aria-label="Main navigation">
  <button>Projects</button>
</nav>

// ❌ Bad
<div className="nav">
  <div onClick={...}>Projects</div>
</div>
```

## Accessibility Guidelines

- Use proper heading hierarchy (h1 → h2 → h3)
- Add `aria-label` to icon-only buttons
- Ensure keyboard navigation works (test Tab order)
- Maintain color contrast (use shadcn design tokens)
- Provide focus indicators (shadcn handles this)

## Component Discovery

### Finding Components

Use shadcn MCP with natural language:

```
"search for file upload component"
"show me form input components"
"preview multi-step form wizard"
"install tabs from shadcn"
"find animated card from Aceternity"
```

### Component Previews

Always preview before installing:

```
"preview button component from shadcn"
"show me what the dialog looks like"
```

## Installation Best Practices

1. **Search first**: Use MCP to find existing components
2. **Preview**: Check if it matches your needs
3. **Install**: Use MCP to auto-install with dependencies
4. **Wrap (if needed)**: Create stable wrapper for external blocks
5. **Test**: Verify it works in your use case

## Common Patterns (Compose Inline)

### Multi-Step Forms

**DON'T create `MultiStepForm` wrapper component.**

Do this in the page:

```typescript
// app/(auth)/onboarding/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  
  return (
    <div className="space-y-6">
      <Progress value={(step / 3) * 100} />
      
      {step === 0 && <div>{/* Step 1 fields */}</div>}
      {step === 1 && <div>{/* Step 2 fields */}</div>}
      {step === 2 && <div>{/* Step 3 fields */}</div>}
      
      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        <Button onClick={() => step === 2 ? handleSubmit() : setStep(step + 1)}>
          {step === 2 ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
}
```

### Sidebar Navigation

**DON'T create custom sidebar component. Use Aceternity's Sidebar:**

```
"install sidebar from Aceternity"
```

```typescript
// app/(student)/layout.tsx
import { Sidebar, SidebarLink } from '@/components/ui/sidebar';

export default function StudentLayout({ children }) {
  return (
    <Sidebar>
      <SidebarLink href="/browse">Browse Projects</SidebarLink>
      <SidebarLink href="/applications">My Applications</SidebarLink>
      <SidebarLink href="/profile">Settings</SidebarLink>
      {children}
    </Sidebar>
  );
}
```

## Next Steps

When building a new component:
1. **Check for existing**: Search with shadcn MCP first
2. **Choose the right category**: Primitive, block, form, shell, or domain?
3. **Define types**: Use TypeScript interfaces for props
4. **Handle state**: Make it controlled, accept callbacks
5. **Add validation**: Use Zod for complex inputs
6. **Make it testable**: Add data-testid attributes
7. **Ensure accessibility**: Semantic HTML, ARIA labels
8. **Document usage**: Add JSDoc comments for complex props

