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


