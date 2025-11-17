import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Briefcase, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import type { Project, StudentLimits } from '@/app/student/search/_components/types'
import { getSavedProjects } from '@/lib/actions/saved-projects'
import { checkStudentLimits } from '@/lib/actions/applications'
import { DashboardApplications } from './_components/DashboardApplications'

export type CurrentUser = {
  id: string
  name: string | null
  email: string
  school_name: string | null
}

export type ActiveApplicationItem = {
  applicationId: string
  status: string
  inviteStatus: string | null
  createdAt: string | null
  submittedAt: string | null
  project: Project
}

export type AcceptedProjectItem = {
  applicationId: string
  project: Project & {
    contact_name?: string | null
    contact_email?: string | null
  }
}

function mapProjectFromRow(row: any): Project {
  if (!row) {
    return {
      id: '',
      title: null,
      short_summary: null,
      detailed_description: null,
      deliverables: null,
      project_type: null,
      skills_needed: null,
      min_students: null,
      max_students: null,
      weekly_hours: null,
      max_teams: null,
      access_type: null,
      status: null,
      start_date: null,
      end_date: null,
      updated_at: null,
      company_id: null,
      collaboration_style: null,
      location: null,
      resource_links: null,
      resource_files: null,
      view_count: null,
      companies: null,
    }
  }

  return {
    id: row.id,
    title: row.title ?? null,
    short_summary: row.short_summary ?? null,
    detailed_description: row.detailed_description ?? null,
    deliverables: row.deliverables ?? null,
    project_type: row.project_type ?? null,
    skills_needed: row.skills_needed ?? null,
    min_students: row.min_students ?? null,
    max_students: row.max_students ?? null,
    weekly_hours: row.weekly_hours ?? null,
    max_teams: row.max_teams ?? null,
    access_type: row.access_type ?? null,
    status: row.status ?? null,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    updated_at: row.updated_at ?? null,
    company_id: row.company_id ?? null,
    collaboration_style: row.collaboration_style ?? null,
    location: row.location ?? null,
    resource_links: row.resource_links ?? null,
    resource_files: row.resource_files ?? null,
    view_count: row.view_count ?? null,
    companies: row.companies
      ? {
          name: row.companies.name ?? null,
          logo_url: row.companies.logo_url ?? null,
        }
      : null,
    is_saved: row.is_saved,
  }
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user name
  const { data: userData } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'STUDENT') {
    redirect('/')
  }

  const userName = userData?.name || 'Student'

  // Get current user's school name
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

  const currentUser: CurrentUser = {
    id: user.id,
    name: userData?.name || null,
    email: user.email || '',
    school_name: schoolName,
  }

  // Saved projects (for bookmark state)
  const savedProjectIds = await getSavedProjects()

  // Student limits (for application creation in modal)
  const studentLimits: StudentLimits = await checkStudentLimits(user.id)

  // Fetch total count of all available projects
  const { count: totalAvailableProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'ACCEPTING')

  // Fetch trending projects (top 6 by view count)
  const { data: trendingProjectsRaw } = await supabase
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
      view_count,
      company_id,
      collaboration_style,
      location,
      resource_links,
      resource_files,
      companies(name, logo_url)
    `)
    .eq('status', 'ACCEPTING')
    .order('view_count', { ascending: false })
    .limit(6)

  // Fetch active applications (PENDING or SUBMITTED)
  const { data: activeApplicationsRaw } = await supabase
    .from('team_members')
    .select(`
      application_id,
      invite_status,
      applications!inner(
        id,
        status,
        created_at,
        submitted_at,
        project_id,
        projects!inner(
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
          view_count,
          company_id,
          collaboration_style,
          location,
          resource_links,
          resource_files,
          contact_name,
          contact_email,
          companies(name, logo_url)
        )
      )
    `)
    .eq('student_id', user.id)
    .in('applications.status', ['PENDING', 'SUBMITTED'])

  // Fetch accepted projects
  const { data: acceptedProjectsRaw } = await supabase
    .from('team_members')
    .select(`
      application_id,
      applications!inner(
        id,
        status,
        project_id,
        projects!inner(
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
          view_count,
          company_id,
          collaboration_style,
          location,
          resource_links,
          resource_files,
          contact_name,
          contact_email,
          companies(name, logo_url)
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('applications.status', 'ACCEPTED')

  // Normalize trending projects
  const trendingProjects: Project[] = (trendingProjectsRaw || []).map((project: any) =>
    mapProjectFromRow(project)
  )

  // Normalize active applications and filter out incomplete rows
  const activeApplications: ActiveApplicationItem[] = (activeApplicationsRaw || [])
    .map((item: any) => {
      const app = item.applications as any
      const project = app?.projects as any

      if (!app || !project) {
        return null
      }

      return {
        applicationId: item.application_id,
        status: app.status,
        inviteStatus: item.invite_status,
        createdAt: app.created_at,
        submittedAt: app.submitted_at,
        project: mapProjectFromRow(project),
      } as ActiveApplicationItem
    })
    .filter((item: ActiveApplicationItem | null): item is ActiveApplicationItem => item !== null)

  // Normalize accepted projects
  const acceptedProjects: AcceptedProjectItem[] = (acceptedProjectsRaw || [])
    .map((item: any) => {
      const app = item.applications as any
      const project = app?.projects as any

      if (!app || !project) {
        return null
      }

      const mappedProject = mapProjectFromRow(project) as AcceptedProjectItem['project']
      mappedProject.contact_name = project.contact_name ?? null
      mappedProject.contact_email = project.contact_email ?? null

      return {
        applicationId: item.application_id,
        project: mappedProject,
      } as AcceptedProjectItem
    })
    .filter((item: AcceptedProjectItem | null): item is AcceptedProjectItem => item !== null)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-muted-foreground">
          Here's what's happening with your applications and projects
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Applications
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApplications?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Pending or under review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedProjects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Accepted applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvailableProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting applications
            </p>
          </CardContent>
        </Card>
      </div>

      <DashboardApplications
        acceptedProjects={acceptedProjects}
        activeApplications={activeApplications}
        trendingProjects={trendingProjects}
        savedProjectIds={savedProjectIds}
        studentLimits={studentLimits}
        currentUser={currentUser}
      />
    </div>
  )
}

