// Type definitions for student browse page

export type Project = {
  id: string
  title: string | null
  short_summary: string | null
  detailed_description: string | null
  deliverables: string | null
  project_type: string[] | null
  skills_needed: string[] | null
  min_students: number | null
  max_students: number | null
  weekly_hours: number | null
  max_teams: number | null
  access_type: 'OPEN' | 'CLOSED' | null
  status: string | null
  start_date: string | null
  end_date: string | null
  updated_at: string | null
  company_id: string | null
  collaboration_style: string | null
  location: string | null
  resource_links: string | null
  resource_files: string[] | null
  view_count: number | null
  companies: {
    name: string | null
    logo_url: string | null
  } | null
  is_saved?: boolean
}

export type FilterParams = {
  q?: string
  access?: 'open' | 'my'
  teamMin?: number
  teamMax?: number
  maxTeams?: number
  unlimited?: boolean
  collab?: string[]
  location?: string
  hours?: string[]
  sort?: 'updated_desc' | 'title_asc' | 'team_min_asc'
}

export type StudentLimits = {
  canApply: boolean
  activeProjects: number
  activeApplications: number
  errors: string[]
}

