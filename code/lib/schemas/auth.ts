import { z } from 'zod';

// Student sign-up: email validation only (profile completed in onboarding)
export const studentSignUpSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .refine((email) => email.endsWith('.edu'), {
      message: 'Must use your university .edu email address',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type StudentSignUpInput = z.infer<typeof studentSignUpSchema>;

// Company sign-up: email + basic info
export const companySignUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Full name is required').max(100),
  role: z.string().min(2, 'Your role at the company is required').max(100),
});

export type CompanySignUpInput = z.infer<typeof companySignUpSchema>;

// Universal sign-in (works for both students and companies)
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type SignInInput = z.infer<typeof signInSchema>;

// Password reset request
export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Update password (after reset link)
export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

// Student onboarding (multi-step)
export const studentOnboardingSchema = z.object({
  grad_date: z.date({
    required_error: 'Graduation date is required',
    invalid_type_error: 'Invalid date',
  }),
  interests: z
    .array(z.string())
    .min(1, 'Select at least one area of interest')
    .max(10, 'Select up to 10 areas of interest'),
  description: z
    .string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must be under 500 characters'),
  resume: z.instanceof(File).optional(),
});

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;

// Predefined interest options for students
export const INTEREST_OPTIONS = [
  'Design',
  'UX/UI',
  'Product Management',
  'Software Engineering',
  'Data Science',
  'Machine Learning',
  'Marketing',
  'Strategy & Consulting',
  'Research',
  'Business Development',
  'Content Creation',
  'Social Media',
  'Finance',
  'Operations',
  'Sales',
] as const;

