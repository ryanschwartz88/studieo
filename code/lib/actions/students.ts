'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { studentOnboardingSchema, type StudentOnboardingInput } from '@/lib/schemas/auth';

/**
 * Complete student onboarding profile
 * Updates student_profiles with required information
 */
export async function completeOnboarding(formData: StudentOnboardingInput) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Validate schema (except file, handled separately)
  const { resume, ...formProfileData } = formData;
  const result = studentOnboardingSchema.omit({ resume: true }).safeParse(formProfileData);
  
  if (!result.success) {
    return { 
      success: false, 
      error: result.error.message || 'Invalid form data' 
    };
  }
  
  const { grad_date, interests, description } = result.data;
  
  // Use UPSERT to handle both insert and update cases
  // This ensures the profile is created if it doesn't exist (shouldn't happen, but safe)
  const profileData = {
    user_id: user.id,
    grad_date: grad_date.toISOString().split('T')[0], // Format as YYYY-MM-DD
    interests,
    description,
    updated_at: new Date().toISOString(),
  };
  
  const { error: upsertError } = await supabase
    .from('student_profiles')
    .upsert(profileData, {
      onConflict: 'user_id',
    });
  
  if (upsertError) {
    console.error('[completeOnboarding] Profile upsert error:', upsertError);
    return { 
      success: false, 
      error: upsertError.message || 'Failed to update profile. Please try again.' 
    };
  }
  
  revalidatePath('/auth/onboarding');
  revalidatePath('/student/dashboard');
  redirect('/student/search');
}

/**
 * Upload student resume to Supabase Storage
 * Path enforced by RLS: {user_id}/resume.pdf
 */
export async function uploadResume(file: File) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has STUDENT role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    console.error('Error fetching user role:', userError);
    return { success: false, error: 'Could not verify user role' };
  }
  
  if (userData.role !== 'STUDENT') {
    return { success: false, error: 'Only students can upload resumes' };
  }
  
  // Validate file
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'File must be under 5MB' };
  }
  
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { success: false, error: 'Only PDF and Word documents are allowed' };
  }
  
  // Generate file path (enforced by RLS policy)
  const filePath = `${user.id}/resume.pdf`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true, 
    });
  
  if (uploadError) {
    console.error('Resume upload error:', uploadError);
    return { 
      success: false, 
      error: `Failed to upload resume. Please try again.` 
    };
  }
  
  // Update student profile with resume URL
  const { error: updateError } = await supabase
    .from('student_profiles')
    .update({
      resume_url: `resumes/${filePath}`,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', user.id);
  
  if (updateError) {
    // Resume uploaded but profile update failed
    console.error('Profile update error:', updateError);
    return { success: false, error: 'Resume uploaded but failed to update profile' };
  }
  
  revalidatePath('/profile');
  
  return { success: true, message: 'Resume uploaded successfully' };
}

/**
 * Get signed URL for student resume
 * Used to download/view resumes
 */
export async function getResumeUrl(userId: string) {
  const supabase = await createClient();
  
  const filePath = `${userId}/resume.pdf`;
  
  const { data, error } = await supabase.storage
    .from('resumes')
    .createSignedUrl(filePath, 3600); // Valid for 1 hour
  
  if (error) {
    return { success: false, error: 'Failed to get resume URL' };
  }
  
  return { success: true, url: data.signedUrl };
}

/**
 * Update student profile (after onboarding)
 */
export async function updateStudentProfile(updates: {
  interests?: string[];
  description?: string;
  grad_date?: Date;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Format grad_date if provided
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  if (updates.grad_date) {
    updateData.grad_date = updates.grad_date.toISOString().split('T')[0];
  }
  
  const { error } = await supabase
    .from('student_profiles')
    .update(updateData)
    .eq('user_id', user.id);
  
  if (error) {
    return { success: false, error: 'Failed to update profile' };
  }
  
  revalidatePath('/profile');
  
  return { success: true, message: 'Profile updated successfully' };
}

/**
 * Get student profile data
 */
export async function getStudentProfile() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (error) {
    return { success: false, error: 'Failed to fetch profile' };
  }
  
  return { success: true, profile: data };
}

/**
 * Search for students by name or email using RPC
 * Excludes the current user from results
 * Uses SECURITY DEFINER function to bypass RLS
 * Returns student info with school name
 */
export async function searchStudents(query: string = '') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', students: [] };
  }
  
  // Call the RPC function which bypasses RLS and returns school info
  const { data, error } = await supabase.rpc('search_students', {
    q: query.trim()
  });
  
  if (error) {
    console.error('Error searching students:', error);
    return { success: false, error: 'Failed to search students', students: [] };
  }
  
  return { success: true, students: data || [] };
}

