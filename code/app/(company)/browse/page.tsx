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
    sort?: 'updated_desc' | 'title_asc' | 'team_min_asc'
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

  // Build query
  let query = supabase
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
      companies (
        name,
        logo_url
      )
    `)

  // Always show projects that are accepting applications
  query = query.eq('status', 'ACCEPTING')

  // Access type filter (OPEN vs CLOSED)
  const access = (params.access || 'OPEN').toUpperCase()
  if (access === 'OPEN' || access === 'CLOSED') {
    query = query.eq('access_type', access)
  }

  // Search filter
  if (params.q) {
    // Note: We need to search both project title and company name
    // This is a simplified approach - for production, consider full-text search
    query = query.ilike('title', `%${params.q}%`)
  }

  // Team size filter (overlap logic)
  const teamMinRaw = params.teamMin ? Number(params.teamMin) : 1
  const teamMaxRaw = params.teamMax ? Number(params.teamMax) : 11
  
  // Only apply filter if not at default values (1 and 11)
  if (teamMinRaw !== 1 || teamMaxRaw !== 11) {
    // Interpret 11 as 10+ (effectively no upper bound)
    const teamMin = teamMinRaw
    const teamMax = teamMaxRaw === 11 ? 9999 : teamMaxRaw
    
    // Projects where min_students <= teamMax AND max_students >= teamMin
    // This ensures overlap: project's range overlaps with user's selected range
    query = query.lte('min_students', teamMax).gte('max_students', teamMin)
  }

  // Max teams filter
  // Only apply filter if unlimited is OFF and a specific number is set
  if (params.unlimited !== 'true' && params.maxTeams) {
    const maxTeamsNum = Number(params.maxTeams)
    if (!isNaN(maxTeamsNum)) {
      // Show projects with max_teams <= specified number OR unlimited (null)
      query = query.or(`max_teams.is.null,max_teams.lte.${maxTeamsNum}`)
    }
  }
  // If unlimited is ON, no filter applied - show all projects regardless of max_teams

  // Collaboration filter
  if (params.collab) {
    const collabValues = params.collab.split(',').filter(Boolean)
    if (collabValues.length > 0) {
      query = query.in('collaboration_style', collabValues)
    }
  }

  // Location filter
  if (params.location) {
    query = query.ilike('location', `%${params.location}%`)
  }

  // Weekly hours filter
  if (params.hours) {
    const hourBuckets = params.hours.split(',').filter(Boolean)
    if (hourBuckets.length > 0) {
      const conditions: string[] = []
      
      hourBuckets.forEach(bucket => {
        if (bucket === '1-5') {
          conditions.push('weekly_hours.lte.5')
        } else if (bucket === '5-10') {
          conditions.push('and(weekly_hours.gte.5,weekly_hours.lte.10)')
        } else if (bucket === '10-15') {
          conditions.push('and(weekly_hours.gte.10,weekly_hours.lte.15)')
        } else if (bucket === '15-20') {
          conditions.push('and(weekly_hours.gte.15,weekly_hours.lte.20)')
        } else if (bucket === '20+') {
          conditions.push('weekly_hours.gte.20')
        }
      })

      if (conditions.length > 0) {
        query = query.or(conditions.join(','))
      }
    }
  }

  // Sorting
  const sort = params.sort || 'updated_desc'
  if (sort === 'updated_desc') {
    query = query.order('updated_at', { ascending: false })
  } else if (sort === 'title_asc') {
    query = query.order('title', { ascending: true })
  } else if (sort === 'team_min_asc') {
    query = query.order('min_students', { ascending: true })
  }

  const { data: projects, error } = await query

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

  return (
    <Suspense fallback={<BrowseClientSkeleton />}>
      <BrowseClient
        initialProjects={(projects || []) as unknown as Project[]}
        userCompanyId={userCompanyId}
      />
    </Suspense>
  )
}
