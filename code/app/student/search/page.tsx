import { createClient } from '@/lib/supabase/server'
import { BrowseClient } from './_components/BrowseClient'
import { getSavedProjects } from '@/lib/actions/saved-projects'
import { checkStudentLimits } from '@/lib/actions/applications'
import { Project } from './_components/types'

export default async function StudentBrowsePage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Authentication Required</h1>
        <p className="text-sm text-muted-foreground mt-2">Please log in to browse projects.</p>
      </div>
    )
  }
  
  // Fetch ACCEPTING projects with company info
  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      short_summary,
      detailed_description,
      deliverables,
      project_type,
      skills_needed,
      min_students,
      max_students,
      weekly_hours,
      max_teams,
      access_type,
      status,
      start_date,
      end_date,
      updated_at,
      company_id,
      collaboration_style,
      location,
      resource_links,
      resource_files,
      view_count,
      companies (
        name,
        logo_url
      )
    `)
    .eq('status', 'ACCEPTING')
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
  }
  
  // Get user's saved projects
  const savedProjectIds = await getSavedProjects()
  
  // Check student's current limits
  const limits = await checkStudentLimits(user.id)
  
  // Get current user's full info (name and school)
  const { data: userData } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', user.id)
    .single()
  
  // Get school name from email domain
  let schoolName: string | null = null
  if (user.email) {
    const emailDomain = user.email.split('@')[1]
    const { data: schoolData } = await supabase
      .from('allowed_school_domains')
      .select('school_name')
      .eq('domain', emailDomain)
      .eq('active', true)
      .single()
    
    schoolName = schoolData?.school_name || null
  }
  
  const currentUser = {
    id: user.id,
    name: userData?.name || null,
    email: user.email || '',
    school_name: schoolName
  }
  
  return (
    <BrowseClient 
      initialProjects={projects as unknown as Project[] || []} 
      savedProjectIds={savedProjectIds}
      studentLimits={limits}
      currentUser={currentUser}
    />
  )
}

