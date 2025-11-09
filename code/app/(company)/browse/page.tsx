import { createClient } from '@/lib/supabase/server'
import { BrowseClient, BrowseClientSkeleton } from './_components/BrowseClient'
import { Suspense } from 'react'
import { Project } from './_components/types'

interface BrowsePageProps {
  searchParams: Promise<{
    q?: string
    access?: 'OPEN' | 'CLOSED'
    teamMin?: string
    teamMax?: string
    maxTeams?: string
    unlimited?: string
    collab?: string
    location?: string
    hours?: string
    sort?: 'updated_desc' | 'title_asc' | 'team_min_asc' | 'relevance'
  }>
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Get current user and company
  const { data: { user } } = await supabase.auth.getUser()
  
  let userCompanyId: string | null = null
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', user.id)
      .single()
    userCompanyId = userData?.company_id || null
  }

  // Use full-text search function for better search capabilities
  // Prepare filter parameters
  const access = (params.access || 'OPEN').toUpperCase() as 'OPEN' | 'CLOSED' | null
  const teamMin = params.teamMin ? Number(params.teamMin) : 1
  const teamMax = params.teamMax ? Number(params.teamMax) : 11
  const maxTeams = params.unlimited !== 'true' && params.maxTeams ? Number(params.maxTeams) : null
  const collaboration = params.collab ? params.collab.split(',').filter(Boolean) : null
  const hours = params.hours ? params.hours.split(',').filter(Boolean) : null
  const sort = params.sort || 'updated_desc'
  
  // Use relevance sorting if there's a search query
  const sortBy = params.q && params.q.trim() ? 'relevance' : sort

  // Call the search_projects RPC function
  const { data: projects, error } = await supabase.rpc('search_projects', {
    search_query: params.q || null,
    project_status_filter: 'ACCEPTING',
    access_type_filter: (access === 'OPEN' || access === 'CLOSED') ? access : null,
    team_min_filter: teamMin,
    team_max_filter: teamMax,
    max_teams_filter: maxTeams,
    unlimited_teams: params.unlimited === 'true',
    collaboration_filter: collaboration,
    location_filter: params.location || null,
    hours_filter: hours,
    sort_by: sortBy
  })

  if (error) {
    console.error('Error fetching projects:', error)
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error Loading Projects</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Unable to load projects. Please try again later.
        </p>
      </div>
    )
  }

  // Map RPC function results to Project type format
  const mappedProjects: Project[] = (projects || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    short_summary: p.short_summary,
    detailed_description: p.detailed_description,
    deliverables: p.deliverables,
    project_type: p.project_type,
    skills_needed: p.skills_needed,
    min_students: p.min_students,
    max_students: p.max_students,
    weekly_hours: p.weekly_hours,
    max_teams: p.max_teams,
    access_type: p.access_type,
    status: p.status,
    start_date: p.start_date,
    end_date: p.end_date,
    updated_at: p.updated_at,
    company_id: p.company_id,
    collaboration_style: p.collaboration_style,
    location: p.location,
    resource_links: p.resource_links,
    resource_files: p.resource_files,
    companies: {
      name: p.company_name,
      logo_url: p.company_logo_url
    }
  }))

  return (
    <Suspense fallback={<BrowseClientSkeleton />}>
      <BrowseClient
        initialProjects={mappedProjects}
        userCompanyId={userCompanyId}
      />
    </Suspense>
  )
}
