import { z } from 'zod';
import { INTEREST_OPTIONS, SUGGESTED_SKILLS } from './auth';

// Use the same interest options for project types (but allow custom in UI)
export const PROJECT_TYPE_OPTIONS = INTEREST_OPTIONS;

// Export suggested skills for use in UI
export { SUGGESTED_SKILLS };

// Collaboration style options
export const COLLABORATION_STYLES = [
  'Remote',
  'Hybrid',
  'In-person',
] as const;

// Mentorship preference enum (matches DB)
export const MENTORSHIP_OPTIONS = ['YES', 'NO', 'OTHER'] as const;

// Confidentiality level enum (matches DB)
export const CONFIDENTIALITY_OPTIONS = [
  'PUBLIC',
  'CONFIDENTIAL_NO_NDA',
  'NDA_REQUIRED',
] as const;

// Project status enum (matches DB)
export const PROJECT_STATUS = [
  'INCOMPLETE',
  'SCHEDULED',
  'ACCEPTING',
  'IN_PROGRESS',
  'COMPLETED',
] as const;

// Project access type enum (matches DB)
export const PROJECT_ACCESS_TYPE = ['OPEN', 'CLOSED'] as const;

// Main project creation schema
export const createProjectSchema = z.object({
  // Step 1: Project Essence
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be under 200 characters'),
  short_summary: z
    .string()
    .min(20, 'Summary must be at least 20 characters')
    .max(200, 'Summary must be under 200 characters'),
  project_type: z
    .array(z.string())
    .min(1, 'Select at least one project type')
    .max(3, 'Select up to 3 project types'),

  // Step 2: The Details
  detailed_description: z
    .string()
    .min(100, 'Description must be at least 100 characters')
    .max(2000, 'Description must be under 2000 characters'),
  deliverables: z
    .string()
    .min(50, 'Deliverables must be at least 50 characters')
    .max(1000, 'Deliverables must be under 1000 characters'),

  // Step 3: Team Dynamics & Access
  access_type: z.enum(PROJECT_ACCESS_TYPE),
  min_students: z
    .number()
    .int()
    .min(1, 'Minimum 1 student'),
  max_students: z
    .number()
    .int()
    .min(1, 'Minimum 1 student'),
  max_teams: z
    .number()
    .int()
    .min(1, 'Minimum 1 team')
    .nullable()
    .optional(),
  weekly_hours: z
    .number()
    .int()
    .min(1, 'Minimum 1 hour per week')
    .max(40, 'Maximum 40 hours per week'),

  // Step 4: Skills & Collaboration
  skills_needed: z
    .array(z.string())
    .min(1, 'Select at least one skill')
    .max(10, 'Select up to 10 skills'),
  collaboration_style: z.enum(COLLABORATION_STYLES),
  mentorship: z.enum(MENTORSHIP_OPTIONS),

  // Step 5: Timeline & Resources
  start_date: z.date({ message: 'Start date is required' }),
  end_date: z.date({ message: 'End date is required' }),
  open_date: z.date().optional(),
  resource_links: z.string().optional(),
  resource_files: z.array(z.string()).optional(), // URLs after upload
  internal_notes: z.string().max(1000).optional(),

  // Step 6: Contact & Confidentiality
  contact_name: z
    .string()
    .min(2, 'Contact name is required')
    .max(100, 'Name must be under 100 characters'),
  contact_role: z
    .string()
    .min(2, 'Contact role is required')
    .max(100, 'Role must be under 100 characters'),
  contact_email: z.string().email('Valid email is required'),
  confidentiality: z.enum(CONFIDENTIALITY_OPTIONS),

  // Optional tags
  tags: z.array(z.string()).optional(),
})
  .refine((data) => data.max_students >= data.min_students, {
    message: 'Maximum students must be greater than or equal to minimum students',
    path: ['max_students'],
  })
  .refine((data) => data.end_date > data.start_date, {
    message: 'End date must be after start date',
    path: ['end_date'],
  })
  .refine((data) => {
    if (data.open_date && data.start_date) {
      // Open date must be at most one day before start date
      const maxOpenDate = new Date(data.start_date);
      maxOpenDate.setDate(maxOpenDate.getDate() - 1);
      maxOpenDate.setHours(23, 59, 59, 999); // End of day
      return data.open_date <= maxOpenDate;
    }
    return true;
  }, {
    message: 'Open date must be at most one day before project start date',
    path: ['open_date'],
  });

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Helper type for form state (includes additional UI state)
export type ProjectFormState = CreateProjectInput & {
  // Status will be set based on which action button is clicked
  status?: (typeof PROJECT_STATUS)[number];
  open_date?: Date; // For SCHEDULED status
};

// Helper to get descriptive label for weekly hours
export function getHoursLabel(hours: number): string {
  if (hours <= 10) return 'Light';
  if (hours <= 20) return 'Moderate';
  if (hours <= 30) return 'Substantial';
  return 'Full-time';
}

// Helper to calculate duration in weeks
export function calculateDuration(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.ceil(diffDays / 7);
}


// Mentorship display labels
export const MENTORSHIP_LABELS = {
  YES: {
    title: 'Yes',
    description: "We'll provide guidance and mentorship throughout the project",
  },
  NO: {
    title: 'No',
    description: 'Students will work independently with minimal guidance',
  },
  OTHER: {
    title: 'Other',
    description: 'Mentorship level depends on project phase or student needs',
  },
} as const;

// Confidentiality display labels
export const CONFIDENTIALITY_LABELS = {
  PUBLIC: {
    title: 'Public',
    description: 'Project details visible to all students',
    icon: 'Globe',
  },
  CONFIDENTIAL_NO_NDA: {
    title: 'Confidential (No NDA)',
    description: 'Project details visible but work is confidential',
    icon: 'Eye',
  },
  NDA_REQUIRED: {
    title: 'NDA Required',
    description: 'Students must sign NDA before accessing project details',
    icon: 'Lock',
  },
} as const;

// Project access type display labels
export const ACCESS_TYPE_LABELS = {
  OPEN: {
    title: 'Open Project',
    description: 'Students can join and work independently',
    icon: 'Users',
    recommended: true,
  },
  CLOSED: {
    title: 'Closed Project',
    description: 'Review applications before students can start',
    icon: 'UserCheck',
    recommended: false,
  },
} as const;

// Inline edit schema for partial project updates (client-friendly)
export const projectInlineUpdateSchema = z.object({
  title: z.string().min(2, 'Title is too short').max(200, 'Title too long').optional(),
  short_summary: z.string().min(10, 'Summary too short').max(300, 'Summary too long').optional(),
  detailed_description: z.string().min(20, 'Description too short').max(5000, 'Description too long').optional(),
  deliverables: z.string().min(10, 'Deliverables too short').max(2000, 'Deliverables too long').optional(),
  resource_links: z.string().optional(),
});

