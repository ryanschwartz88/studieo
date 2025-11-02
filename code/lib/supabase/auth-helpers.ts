import { redirect } from 'next/navigation';
import { createClient } from './server';

export type UserRole = 'STUDENT' | 'COMPANY';

/**
 * Get the current user's role from the database
 * Returns null if user is not authenticated or role not found
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (error || !data) return null;
  
  return data.role as UserRole;
}

/**
 * Require a specific role, redirect to home if user doesn't have it
 * Use in server components and server actions
 */
export async function requireRole(role: UserRole): Promise<void> {
  const userRole = await getUserRole();
  
  if (userRole !== role) {
    redirect('/');
  }
}

/**
 * Require authentication, redirect to login if not authenticated
 */
export async function requireAuth(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
}

/**
 * Require email verification. Redirects to /auth/verify-email if not verified.
 */
export async function requireEmailVerified(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (!user.email_confirmed_at) {
    redirect('/auth/verify-email');
  }
}

/**
 * Check if student has completed onboarding
 * Returns status and profile data
 */
export async function getOnboardingStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { complete: false, data: null };
  }
  
  const role = await getUserRole();
  
  // Companies don't have required onboarding
  if (role === 'COMPANY') {
    return { complete: true, data: null };
  }
  
  // Check student profile completion
  if (role === 'STUDENT') {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('grad_date, interests, description, resume_url')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
      return { complete: false, data: null };
    }
    
    // Required fields for onboarding completion
    const complete = !!(
      data.grad_date && 
      data.interests && 
      data.interests.length > 0 && 
      data.description
    );
    
    return { complete, data };
  }
  
  return { complete: false, data: null };
}

/**
 * Require onboarding to be complete, redirect to onboarding if not
 * Use in student route layouts
 */
export async function requireOnboarding(): Promise<void> {
  // Ensure email is verified before allowing onboarding check
  await requireEmailVerified();
  const { complete } = await getOnboardingStatus();
  
  if (!complete) {
    redirect('/auth/onboarding');
  }
}

/**
 * Get user with role data
 * Returns null if not authenticated
 */
export async function getUserWithRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const role = await getUserRole();
  
  return {
    ...user,
    role,
  };
}

/**
 * Check if user is authenticated and get redirect path
 * Used in auth layout to redirect authenticated users
 */
export async function getAuthenticatedRedirect(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  const role = await getUserRole();
  
  if (role === 'STUDENT') {
    const { complete } = await getOnboardingStatus();
    return complete ? '/browse' : '/auth/onboarding';
  }
  
  if (role === 'COMPANY') {
    return '/dashboard';
  }
  
  return '/';
}

