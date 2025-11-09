'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { createProjectSchema, type CreateProjectInput, type ProjectFormState, PROJECT_STATUS, projectInlineUpdateSchema } from '@/lib/schemas/projects';

/**
 * Create a new project
 * Handles draft, scheduled, and published projects
 */
export async function createProject(
  formData: CreateProjectInput,
  status: 'INCOMPLETE' | 'SCHEDULED' | 'ACCEPTING' = 'INCOMPLETE',
  openDate?: Date
) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id, name, email')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData) {
    console.error('Error fetching user:', userError);
    return { success: false, error: 'Could not verify user' };
  }
  
  if (userData.role !== 'COMPANY') {
    return { success: false, error: 'Only company users can create projects' };
  }
  
  if (!userData.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  // Validate form data
  const result = createProjectSchema.safeParse(formData);
  
  if (!result.success) {
    console.error('Validation error:', result.error);
    return { 
      success: false, 
      error: (result as any).error?.issues?.[0]?.message || (result as any).error?.message || 'Invalid form data' 
    };
  }
  
  const validatedData = result.data;

  // Conditional validation: open_date must be before start_date only for INCOMPLETE or SCHEDULED status
  if ((status === 'INCOMPLETE' || status === 'SCHEDULED') && validatedData.open_date && validatedData.start_date) {
    const maxOpenDate = new Date(validatedData.start_date);
    maxOpenDate.setDate(maxOpenDate.getDate() - 1);
    maxOpenDate.setHours(23, 59, 59, 999); // End of day
    if (validatedData.open_date > maxOpenDate) {
      return { 
        success: false, 
        error: 'Open date must be at most one day before project start date' 
      };
    }
  }
  
  // Prepare project data for database
  const projectData = {
    company_id: userData.company_id,
    created_by_id: user.id,
    status,
    open_date: status === 'SCHEDULED' && openDate ? openDate.toISOString() : null,
    title: validatedData.title,
    short_summary: validatedData.short_summary,
    detailed_description: validatedData.detailed_description,
    project_type: validatedData.project_type,
    tags: validatedData.tags || [],
    deliverables: validatedData.deliverables,
    skills_needed: validatedData.skills_needed,
    contact_name: validatedData.contact_name,
    contact_role: validatedData.contact_role,
    contact_email: validatedData.contact_email,
    resource_links: validatedData.resource_links || null,
    resource_files: validatedData.resource_files || [],
    internal_notes: validatedData.internal_notes || null,
    start_date: validatedData.start_date.toISOString().split('T')[0],
    end_date: validatedData.end_date.toISOString().split('T')[0],
    access_type: validatedData.access_type,
    min_students: validatedData.min_students,
    max_students: validatedData.max_students,
    max_teams: validatedData.max_teams || null,
    weekly_hours: validatedData.weekly_hours,
    collaboration_style: validatedData.collaboration_style,
    mentorship: validatedData.mentorship,
    confidentiality: validatedData.confidentiality,
    location: validatedData.location || null,
  };
  
  // Insert project
  const { data: project, error: insertError } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single();
  
  if (insertError) {
    console.error('Project creation error:', insertError);
    return { 
      success: false, 
      error: 'Failed to create project. Please try again.' 
    };
  }
  
  // Revalidate relevant paths
  revalidatePath('/projects');
  revalidatePath('/dashboard');
  
  // Always redirect to the newly created project's page
  redirect(`/projects/${project.id}`);
}

/**
 * Upload resource files to Supabase Storage
 * Path: {project_id}/{filename}
 */
export async function uploadResourceFiles(files: File[], projectId?: string) {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // If projectId provided, verify user owns the project
  if (projectId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, created_by_id')
      .eq('id', projectId)
      .eq('created_by_id', user.id)
      .single();
    
    if (projectError || !project) {
      return { success: false, error: 'Project not found or access denied' };
    }
  }
  
  // Validate files
  const maxSize = 10 * 1024 * 1024; // 10MB per file
  const uploadedUrls: string[] = [];
  
  for (const file of files) {
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `File ${file.name} exceeds 10MB limit` 
      };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempFolder = projectId || 'temp';
    const filePath = `${tempFolder}/${timestamp}_${sanitizedName}`;
    
    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('project_resources')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
    
    if (uploadError) {
      console.error('File upload error:', uploadError);
      return { 
        success: false, 
        error: `Failed to upload ${file.name}` 
      };
    }
    
    uploadedUrls.push(`project_resources/${filePath}`);
  }
  
  // If project ID provided, update project with file URLs
  if (projectId) {
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        resource_files: uploadedUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);
    
    if (updateError) {
      console.error('Project update error:', updateError);
      return { 
        success: false, 
        error: 'Files uploaded but failed to update project' 
      };
    }
  }
  
  return { 
    success: true, 
    urls: uploadedUrls,
    message: 'Files uploaded successfully' 
  };
}

/**
 * Update project status (draft → scheduled/open)
 */
export async function updateProjectStatus(
  projectId: string,
  status: 'INCOMPLETE' | 'SCHEDULED' | 'ACCEPTING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED',
  openDate?: Date
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, created_by_id, status')
    .eq('id', projectId)
    .eq('created_by_id', user.id)
    .single();
  
  if (projectError || !project) {
    return { success: false, error: 'Project not found or access denied' };
  }
  
  // Update project
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };
  
  if (status === 'SCHEDULED') {
    updateData.open_date = openDate ? openDate.toISOString() : null;
  }
  
  const { error: updateError } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId);
  
  if (updateError) {
    console.error('Status update error:', updateError);
    return { success: false, error: 'Failed to update project status' };
  }
  
  revalidatePath('/dashboard');
  revalidatePath(`/projects/${projectId}`);
  
  return { success: true, message: `Project ${status.toLowerCase()}` };
}

/**
 * Get project by ID
 */
export async function getProject(projectId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      companies (
        name,
        domain,
        sector,
        description
      )
    `)
    .eq('id', projectId)
    .single();
  
  if (error) {
    console.error('Error fetching project:', error);
    return { success: false, error: 'Project not found' };
  }
  
  return { success: true, project };
}

/**
 * Get all projects for current company user
 */
export async function getCompanyProjects() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Get user's company_id
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single();
  
  if (!userData?.company_id) {
    return { success: false, error: 'User not associated with a company' };
  }
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    return { success: false, error: 'Failed to fetch projects' };
  }
  
  return { success: true, projects };
}

/**
 * Archive project (set status to ARCHIVED)
 */
export async function archiveProject(projectId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify user has COMPANY role and project belongs to their company
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (userError || !userData || userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'Access denied' };
  }
  
  // Verify project belongs to user's company
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, company_id, status')
    .eq('id', projectId)
    .single();
  
  if (projectError || !project) {
    return { success: false, error: 'Project not found' };
  }
  
  if (project.company_id !== userData.company_id) {
    return { success: false, error: 'Access denied' };
  }
  
  // Update status to ARCHIVED
  const { error: updateError } = await supabase
    .from('projects')
    .update({ 
      status: 'ARCHIVED',
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);
  
  if (updateError) {
    console.error('Archive error:', updateError);
    return { success: false, error: 'Failed to archive project' };
  }
  
  revalidatePath('/dashboard');
  revalidatePath(`/projects/${projectId}`);
  
  return { success: true, message: 'Project archived successfully' };
}

/**
 * Delete project (soft delete by setting status to cancelled)
 */
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  // Verify ownership
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, created_by_id')
    .eq('id', projectId)
    .eq('created_by_id', user.id)
    .single();
  
  if (projectError || !project) {
    return { success: false, error: 'Project not found or access denied' };
  }
  
  // Soft delete (or hard delete if preferred)
  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (deleteError) {
    console.error('Delete error:', deleteError);
    return { success: false, error: 'Failed to delete project' };
  }
  
  revalidatePath('/dashboard');
  
  return { success: true, message: 'Project deleted successfully' };
}

/**
 * Update all editable fields of a project
 */
export async function updateProjectFull(
  projectId: string,
  input: CreateProjectInput,
  opts?: { draft?: boolean }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify user role/company
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  if (userError || !userData || userData.role !== 'COMPANY' || !userData.company_id) {
    return { success: false, error: 'Access denied' };
  }

  // Verify project belongs to user AND was created by user
  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .select('id, company_id, created_by_id, status, start_date')
    .eq('id', projectId)
    .single();
  if (projErr || !proj || proj.company_id !== userData.company_id) {
    return { success: false, error: 'Project not found or access denied' };
  }
  
  // Only the creator can edit the project
  if (proj.created_by_id !== user.id) {
    return { success: false, error: 'Only the project creator can edit this project' };
  }

  // Enrich input: default open_date to today if not provided
  const defaultedInput: CreateProjectInput = {
    ...input,
    open_date: input.open_date ?? new Date(),
  };

  // Validate input with same schema as create
  const parsed = createProjectSchema.safeParse(defaultedInput);
  if (!parsed.success) {
    const message = (parsed as any).error?.issues?.[0]?.message || 'Invalid data';
    return { success: false, error: message };
  }
  const data = parsed.data;

  // Conditional validation: open_date must be before start_date only for INCOMPLETE or SCHEDULED status
  if ((proj.status === 'INCOMPLETE' || proj.status === 'SCHEDULED') && data.open_date && data.start_date) {
    const maxOpenDate = new Date(data.start_date);
    maxOpenDate.setDate(maxOpenDate.getDate() - 1);
    maxOpenDate.setHours(23, 59, 59, 999); // End of day
    if (data.open_date > maxOpenDate) {
      return { 
        success: false, 
        error: 'Open date must be at most one day before project start date' 
      };
    }
  }

  let nextStatus: (typeof PROJECT_STATUS)[number] = 'INCOMPLETE';
  if (opts?.draft) {
    // Draft mode: only allowed if project is currently INCOMPLETE
    if (proj.status !== 'INCOMPLETE') {
      return { success: false, error: 'Cannot save as draft: project has already been published.' };
    }
    // Draft mode: force INCOMPLETE and relax runtime guards
    nextStatus = 'INCOMPLETE';
  } else {
    // Guard: if currently IN_PROGRESS, block moving start_date into the future
    try {
      const todayGuard = new Date();
      todayGuard.setHours(0, 0, 0, 0);
      if (proj.status === 'IN_PROGRESS') {
        const newStart = new Date(data.start_date);
        newStart.setHours(0, 0, 0, 0);
        if (newStart > todayGuard) {
          return { success: false, error: 'Project in progress: start date cannot be moved into the future.' };
        }
      }
    } catch {}

    // Derive status from dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(data.start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(data.end_date);
    end.setHours(0, 0, 0, 0);
    const open = data.open_date ? new Date(data.open_date) : new Date();
    open.setHours(0, 0, 0, 0);

    if (end < today) {
      nextStatus = 'COMPLETED';
    } else if (start <= today && today <= end) {
      nextStatus = 'IN_PROGRESS';
    } else if (open > today) {
      nextStatus = 'SCHEDULED';
    } else {
      nextStatus = 'ACCEPTING';
    }
  }

  const update: any = {
    title: data.title,
    short_summary: data.short_summary,
    detailed_description: data.detailed_description,
    project_type: data.project_type,
    tags: data.tags || [],
    deliverables: data.deliverables,
    skills_needed: data.skills_needed,
    contact_name: data.contact_name,
    contact_role: data.contact_role,
    contact_email: data.contact_email,
    resource_links: (data.resource_links || '')
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join('\n') || null,
    resource_files: data.resource_files || [],
    start_date: data.start_date.toISOString().split('T')[0],
    end_date: data.end_date.toISOString().split('T')[0],
    access_type: data.access_type,
    min_students: data.min_students,
    max_students: data.max_students,
    max_teams: data.max_teams ?? null,
    weekly_hours: data.weekly_hours,
    collaboration_style: data.collaboration_style,
    mentorship: data.mentorship,
    confidentiality: data.confidentiality,
    internal_notes: data.internal_notes || null,
    location: data.location || null,
    updated_at: new Date().toISOString(),
    status: nextStatus,
  };

  // Include open_date (default today when absent)
  update.open_date = data.open_date ? data.open_date.toISOString() : new Date().toISOString();

  const { error: updateError } = await supabase
    .from('projects')
    .update(update)
    .eq('id', projectId);
  if (updateError) {
    console.error('Project full update error:', updateError);
    return { success: false, error: 'Failed to update project' };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/**
 * Update a subset of project fields inline
 */
export async function updateProjectFields(
  projectId: string,
  payload: z.infer<typeof projectInlineUpdateSchema>
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify user belongs to a company
  const { data: userData, error: userErr } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (userErr || !userData || userData.role !== 'COMPANY') {
    return { success: false, error: 'Access denied' };
  }

  // Verify project belongs to same company AND user created it
  const { data: proj, error: projErr } = await supabase
    .from('projects')
    .select('company_id, created_by_id')
    .eq('id', projectId)
    .single();
  if (projErr || !proj) {
    return { success: false, error: 'Project not found' };
  }
  if (proj.company_id && userData.company_id && proj.company_id !== userData.company_id) {
    return { success: false, error: 'Access denied' };
  }
  
  // Only the creator can edit the project
  if (proj.created_by_id !== user.id) {
    return { success: false, error: 'Only the project creator can edit this project' };
  }

  // Validate and normalize
  const parsed = projectInlineUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    const message = (parsed as any).error?.issues?.[0]?.message || 'Invalid data';
    return { success: false, error: message };
  }

  const update: any = { ...parsed.data, updated_at: new Date().toISOString() };
  if (typeof update.resource_links === 'string') {
    update.resource_links = update.resource_links
      .split(/\s+/)
      .map((s: string) => s.trim())
      .filter(Boolean)
      .join('\n');
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update(update)
    .eq('id', projectId);
  if (updateError) {
    console.error('Project update error:', updateError);
    return { success: false, error: 'Failed to update project' };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

/**
 * Create a signed URL to view or download a private resource file
 */
export async function getProjectResourceSignedUrl(
  projectId: string,
  path: string,
  opts?: { downloadName?: string }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Verify user belongs to same company as the project
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!userData || userData.role !== 'COMPANY') {
    return { success: false, error: 'Access denied' };
  }
  const { data: proj } = await supabase
    .from('projects')
    .select('company_id')
    .eq('id', projectId)
    .single();
  if (!proj || (proj.company_id && userData.company_id && proj.company_id !== userData.company_id)) {
    return { success: false, error: 'Access denied' };
  }

  const storagePath = path.replace(/^project_resources\//, '');
  const { data, error } = await supabase.storage
    .from('project_resources')
    .createSignedUrl(
      storagePath,
      3600,
      opts?.downloadName ? { download: opts.downloadName } as any : undefined
    );
  if (error) {
    console.error('Signed URL error:', error);
    return { success: false, error: 'Failed to create signed URL' };
  }
  return { success: true, url: data?.signedUrl };
}

/**
 * Record a project view
 * Only tracks views from STUDENT users (not companies viewing their own projects)
 * Tracks unique views per user and updates the view counter
 * Can be called when user views a project details page or modal
 */
export async function recordProjectView(projectId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Optionally allow anonymous views, but for Studieo we require auth
    return { success: false, error: 'Not authenticated' };
  }
  
  // Check user role - only track student views
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  // Only track views from students (not companies)
  if (!userData || userData.role !== 'STUDENT') {
    return { 
      success: true, 
      isNewView: false,
      viewCount: 0,
      message: 'View not tracked (company user)'
    };
  }
  
  // Call the database function to record the view
  const { data, error } = await supabase.rpc('record_project_view', {
    p_project_id: projectId,
    p_user_id: user.id,
  });
  
  if (error) {
    console.error('Error recording project view:', error);
    return { success: false, error: 'Failed to record view' };
  }
  
  return { 
    success: true, 
    isNewView: data?.is_new_view || false,
    viewCount: data?.view_count || 0,
  };
}

/**
 * Get recently viewed projects for current user
 */
export async function getRecentlyViewedProjects(limit: number = 10) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }
  
  const { data, error } = await supabase.rpc('get_recently_viewed_projects', {
    p_user_id: user.id,
    p_limit: limit,
  });
  
  if (error) {
    console.error('Error fetching recently viewed projects:', error);
    return { success: false, error: 'Failed to fetch recently viewed projects' };
  }
  
  return { success: true, projects: data || [] };
}


