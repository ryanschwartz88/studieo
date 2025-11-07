'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import freeEmailDomains from 'free-email-domains';
import { createClient } from '@/lib/supabase/server';
import {
  studentSignUpSchema,
  companySignUpSchema,
  signInSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type StudentSignUpInput,
  type CompanySignUpInput,
  type SignInInput,
} from '@/lib/schemas/auth';

// Convert array to Set for O(1) lookup performance
const FREE_EMAIL_DOMAINS = new Set(freeEmailDomains);

/**
 * Validate if email domain is in allowed_school_domains table
 */
async function validateStudentEmail(email: string): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createClient();
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (!domain) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  const { data, error } = await supabase
    .from('allowed_school_domains')
    .select('domain, school_name')
    .eq('domain', domain)
    .eq('active', true)
    .single();
  
  if (error || !data) {
    return { 
      valid: false, 
      error: "Sorry, we're not at your school yet. Join our waitlist at studieo.com" 
    };
  }
  
  return { valid: true };
}

/**
 * Validate if email domain is NOT a generic/free email provider OR a .edu domain
 * Uses the free-email-domains package to check against a comprehensive list
 */
function validateCompanyEmail(email: string): { valid: boolean; error?: string } {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check if domain is a .edu domain (students should sign up as students)
  if (domain.endsWith('.edu')) {
    return {
      valid: false,
      error: 'University emails cannot be used for company accounts. Please sign up as a student instead.',
    };
  }

  // Check if domain is a free/generic email provider
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: 'Please use your company email address, not a personal email',
    };
  }

  return { valid: true };
}

/**
 * Sign up a student with .edu email
 * Triggers handle_new_user() which creates user and student_profile records
 */
export async function signUpStudent(formData: StudentSignUpInput) {
  const supabase = await createClient();
  
  // Validate schema
  const result = studentSignUpSchema.safeParse(formData);
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues[0]?.message || 'Invalid form data' 
    };
  }
  
  const { name, email, password } = result.data;
  
  // Validate email domain against allowed_school_domains
  const emailValidation = await validateStudentEmail(email);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }
  
  // Create auth account with metadata (handle_new_user trigger creates user and student_profile)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/confirm`,
    },
  });
  
  if (error) {
    // Handle duplicate account error
    if (error.message.includes('already registered')) {
      return { 
        success: false, 
        error: 'An account with this email already exists. Please log in instead.' 
      };
    }
    return { success: false, error: error.message };
  }
  
  if (!data.user) {
    return { success: false, error: 'Failed to create account' };
  }
  
  // Check if user already exists (Supabase returns empty identities array for existing users)
  // When email confirmation is enabled, Supabase won't error but returns the user with empty identities
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      success: false,
      error: 'An account with this email already exists. Please log in instead.',
    };
  }
  
  // Verification-first: redirect to verify-email with email parameter
  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
}

/**
 * Sign up a company user with work email
 * Triggers handle_new_user() which creates/links company and user records
 */
export async function signUpCompany(formData: CompanySignUpInput) {
  const supabase = await createClient();
  
  // Validate schema
  const result = companySignUpSchema.safeParse(formData);
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues[0]?.message || 'Invalid form data' 
    };
  }
  
  const { email, password, name, company_name, role } = result.data;
  
  // Validate email is NOT a generic provider
  const emailValidation = validateCompanyEmail(email);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }
  
  // Create auth account with metadata (handle_new_user trigger uses this)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        company_name,
        role, // Role at company, not user role
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/confirm`,
    },
  });
  
  if (error) {
    if (error.message.includes('already registered')) {
      return { 
        success: false, 
        error: 'An account with this email already exists. Please log in instead.' 
      };
    }
    return { success: false, error: error.message };
  }
  
  if (!data.user) {
    return { success: false, error: 'Failed to create account' };
  }
  
  // Check if user already exists (Supabase returns empty identities array for existing users)
  // When email confirmation is enabled, Supabase won't error but returns the user with empty identities
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    return {
      success: false,
      error: 'An account with this email already exists. Please log in instead.',
    };
  }
  
  // Verification-first: redirect to verify-email with email parameter
  redirect(`/auth/verify-email?email=${encodeURIComponent(email)}`);
}

/**
 * Universal sign in (works for both students and companies)
 * Redirects based on user role after successful login
 */
export async function signIn(formData: SignInInput) {
  const supabase = await createClient();
  
  // Validate schema
  const result = signInSchema.safeParse(formData);
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues[0]?.message || 'Invalid form data' 
    };
  }
  
  const { email, password } = result.data;
  
  // Sign in with Supabase Auth
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { 
      success: false, 
      error: 'Invalid email or password' 
    };
  }
  
  // Get user role to determine redirect
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();
  
  revalidatePath('/', 'layout');
  
  // Redirect based on role
  if (userData?.role === 'STUDENT') {
    // Check if onboarding is complete
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('grad_date, interests, description')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    const onboardingComplete = !!(
      profile?.grad_date && 
      profile?.interests?.length && 
      profile?.description
    );
    
    redirect(onboardingComplete ? '/browse' : '/auth/onboarding');
  } else if (userData?.role === 'COMPANY') {
    redirect('/dashboard');
  }
  
  // Fallback
  redirect('/');
}

/**
 * Google OAuth Sign In (or Sign Up)
 */
export async function signInWithGoogle(redirectTo?: string) {
  const supabase = await createClient();

  const callbackUrl = redirectTo || `${process.env.NEXT_PUBLIC_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Redirect handled by Supabase
  return { success: true, data };
}

/**
 * Resend email verification (signup)
 */
export async function resendVerificationEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Sign out current user
 */
export async function signOut() {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Sign out error:', error);
    // Even if there's an error, redirect to home
  }
  
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * Request password reset email
 */
export async function resetPassword(email: string) {
  const supabase = await createClient();
  
  // Validate email
  const result = resetPasswordSchema.safeParse({ email });
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues[0]?.message || 'Invalid email' 
    };
  }
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/update-password`,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { 
    success: true, 
    message: 'Check your email for a password reset link' 
  };
}

/**
 * Update password (called from reset link)
 */
export async function updatePassword(password: string) {
  const supabase = await createClient();
  
  // Validate password
  const result = updatePasswordSchema.safeParse({ 
    password, 
    confirmPassword: password 
  });
  
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.issues[0]?.message || 'Invalid password' 
    };
  }
  
  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/', 'layout');
  
  // Redirect based on role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', (await supabase.auth.getUser()).data.user?.id)
    .single();
  
  if (userData?.role === 'STUDENT') {
    redirect('/browse');
  } else if (userData?.role === 'COMPANY') {
    redirect('/dashboard');
  }
  
  redirect('/');
}

