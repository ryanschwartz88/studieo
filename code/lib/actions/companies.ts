'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { updateCompanySchema, type UpdateCompanyInput } from '@/lib/schemas/companies';

/**
 * Update company information (name, description, logo_url, domain, location)
 * RLS enforces that only company members can update their own company
 */
export async function updateCompany(data: UpdateCompanyInput) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role and company_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return { success: false, error: 'Could not verify user' };
  }
  
  if (userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  // Validate input
  const result = updateCompanySchema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      error: (result as any).error?.issues?.[0]?.message || 'Invalid input',
    };
  }
  
  const validatedData = result.data;
  
  // Only include fields that are provided
  const updateData: Partial<UpdateCompanyInput> = {};
  if (validatedData.name !== undefined) updateData.name = validatedData.name;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.logo_url !== undefined) updateData.logo_url = validatedData.logo_url;
  if (validatedData.domain !== undefined) updateData.domain = validatedData.domain;
  if (validatedData.location !== undefined) updateData.location = validatedData.location;
  
  // Update company (RLS will enforce company_id match)
  const { error: updateError } = await supabase
    .from('companies')
    .update(updateData)
    .eq('id', userData.company_id);
  
  if (updateError) {
    console.error('Company update error:', updateError);
    return { success: false, error: 'Failed to update company' };
  }
  
  revalidatePath('/settings');
  return { success: true };
}

/**
 * Upload company logo to storage
 * Returns the public URL or signed URL for the logo
 */
export async function uploadCompanyLogo(file: File) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role and company_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return { success: false, error: 'Could not verify user' };
  }
  
  if (userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  // Validate file type (images only)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Invalid file type. Please upload an image (JPEG, PNG, or WebP)' };
  }
  
  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'File size too large. Maximum size is 5MB' };
  }
  
  // Get file extension
  const fileExt = file.name.split('.').pop() || 'png';
  const filePath = `${userData.company_id}/logo.${fileExt}`;
  
  // Upload to storage (RLS will enforce permissions)
  const { error: uploadError } = await supabase.storage
    .from('company_logos')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true, // Replace existing logo
    });
  
  if (uploadError) {
    console.error('Logo upload error:', uploadError);
    return { success: false, error: 'Failed to upload logo' };
  }
  
  // Get public URL
  const { data: urlData } = await supabase.storage
    .from('company_logos')
    .getPublicUrl(filePath);
  
  if (!urlData) {
    return { success: false, error: 'Failed to get logo URL' };
  }
  
  // Update company record with logo URL
  const { error: updateError } = await supabase
    .from('companies')
    .update({ logo_url: urlData.publicUrl })
    .eq('id', userData.company_id);
  
  if (updateError) {
    console.error('Company logo URL update error:', updateError);
    return { success: false, error: 'Failed to update company logo URL' };
  }
  
  revalidatePath('/settings');
  return { success: true, data: { logo_url: urlData.publicUrl } };
}

/**
 * Get all users in the current company
 */
export async function getCompanyUsers() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role and company_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return { success: false, error: 'Could not verify user' };
  }
  
  if (userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  // Get all users in the company
  const { data: companyUsers, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    console.error('Error fetching company users:', fetchError);
    return { success: false, error: 'Failed to fetch company users' };
  }
  
  return { success: true, data: companyUsers || [] };
}

/**
 * Get all projects created by a specific user
 */
export async function getUserProjects(userId: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role and company_id
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    return { success: false, error: 'Could not verify user' };
  }
  
  if (userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  // Verify the target user is in the same company
  const { data: targetUser, error: targetError } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', userId)
    .single();
  
  if (targetError || !targetUser || targetUser.company_id !== userData.company_id) {
    return { success: false, error: 'User not found or not in same company' };
  }
  
  // Get projects created by the user
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('id, title, status, start_date, end_date, created_at')
    .eq('created_by_id', userId)
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false });
  
  if (fetchError) {
    console.error('Error fetching user projects:', fetchError);
    console.error('UserId:', userId, 'CompanyId:', userData.company_id);
    return { success: false, error: `Failed to fetch user projects: ${fetchError.message}` };
  }
  
  
  return { success: true, data: projects || [] };
}

