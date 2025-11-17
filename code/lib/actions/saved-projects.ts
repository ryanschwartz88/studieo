'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleSaveProject(projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if project is already saved
  const { data: existing } = await supabase
    .from('saved_projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('project_id', projectId)
    .single()

  if (existing) {
    // Unsave the project
    const { error } = await supabase
      .from('saved_projects')
      .delete()
      .eq('user_id', user.id)
      .eq('project_id', projectId)

    if (error) {
      return { success: false, error: error.message }
    }

    // Get updated count
    const { count } = await supabase
      .from('saved_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    revalidatePath('/student/search')
    return { success: true, saved: false, count: count ?? 0 }
  } else {
    // Save the project
    const { error } = await supabase
      .from('saved_projects')
      .insert({
        user_id: user.id,
        project_id: projectId,
      })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get updated count
    const { count } = await supabase
      .from('saved_projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    revalidatePath('/student/search')
    return { success: true, saved: true, count: count ?? 0 }
  }
}

export async function getSavedProjects() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data } = await supabase
    .from('saved_projects')
    .select('project_id')
    .eq('user_id', user.id)

  return (data || []).map(item => item.project_id)
}

/**
 * Get saved projects with full details for profile page
 * Returns all saved projects with project and company info, ordered by most recently saved
 */
export async function getSavedProjectsWithDetails() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated', projects: [] }
  }

  const { data, error } = await supabase
    .from('saved_projects')
    .select(`
      id,
      created_at,
      projects (
        id,
        title,
        status,
        start_date,
        end_date,
        companies (
          name,
          logo_url
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching saved projects:', error)
    return { success: false, error: 'Failed to fetch saved projects', projects: [] }
  }

  // Transform the data to flatten the structure
  const projects = (data || []).map((item: any) => ({
    id: item.projects?.id,
    title: item.projects?.title,
    status: item.projects?.status,
    start_date: item.projects?.start_date,
    end_date: item.projects?.end_date,
    company_name: item.projects?.companies?.name,
    company_logo_url: item.projects?.companies?.logo_url,
    saved_at: item.created_at,
  })).filter(p => p.id) // Filter out null projects (in case of deleted projects)

  return { success: true, projects }
}


