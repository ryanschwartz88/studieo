import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid'

import { ProjectStats } from './_components/ProjectStats'
import { ProjectEditToolbar } from './_components/ProjectEditToolbar'
import { ResourceLinks } from './_components/ResourceLinks'
import { ResourceFiles } from './_components/ResourceFiles'
import { BentoModalItem } from './_components/BentoModalItem'
import { ViewTracker } from './_components/ViewTracker'
import { ProjectApplicationsTable } from './_components/ProjectApplicationsTable'
import { CalendarIcon, Users, Target, Shield, Link as LinkIcon, FileText, Brain } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

type Project = {
  id: string
  title: string | null
  short_summary: string | null
  detailed_description: string | null
  deliverables: string | null
  project_type: string[] | null
  access_type: 'OPEN' | 'CLOSED' | null
  min_students: number | null
  max_students: number | null
  weekly_hours: number | null
  max_teams: number | null
  skills_needed: string[] | null
  collaboration_style: string | null
  mentorship: string | null
  start_date: string | null
  end_date: string | null
  resource_links: string | null
  resource_files: string[] | null
  contact_name: string | null
  contact_role: string | null
  contact_email: string | null
  confidentiality: string | null
  status: string | null
  company_id: string | null
  internal_notes: string | null
  location: string | null
  view_count: number | null
  created_by_id: string | null
  custom_questions?: { id: string; question: string; required: boolean }[]
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

function getDurationText(start: string | null, end: string | null) {
  if (!start || !end) return '—'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '—'
  const ms = Math.max(0, endDate.getTime() - startDate.getTime())
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24))
  const weeks = Math.max(1, Math.round(days / 7))
  return `${weeks} wk${weeks > 1 ? 's' : ''}`
}

function getConfidentialityLabel(type: string | null) {
  if (!type) return '—'
  switch (type) {
    case 'CONFIDENTIAL_NO_NDA':
      return 'Confidential - No NDA Required'
    case 'PUBLIC':
      return 'Public - Portfolio Ready'
    case 'NDA_REQUIRED':
      return 'Strictly Confidential - NDA Required'
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase().replace(/_/g, ' ')
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = await createClient()
  const { id } = await params

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Authentication Required</h1>
        <p className="text-sm text-muted-foreground mt-2">Please log in to view this project.</p>
      </div>
    )
  }

  // Get user's company_id for verification
  const { data: userData } = await supabase
    .from('users')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'COMPANY') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">Only company users can view projects.</p>
      </div>
    )
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      [
        'id','title','short_summary','detailed_description','deliverables',
        'project_type','access_type','min_students','max_students','weekly_hours',
        'max_teams','skills_needed','collaboration_style',
        'mentorship','start_date','end_date','resource_links','resource_files',
        'contact_name','contact_role','contact_email','confidentiality','status','company_id',
        'internal_notes','location','view_count','created_by_id','custom_questions',
      ].join(',')
    )
    .eq('id', id)
    .single<Project>()

  // If project not found or error, show error page
  if (projectError || !project) {

    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {projectError?.code === 'PGRST116' 
            ? 'The project you are looking for does not exist or you do not have permission to view it.'
            : `Error: ${projectError?.message || 'Unable to load project'}`}
        </p>
        {process.env.NODE_ENV === 'development' && projectError && (
          <pre className="mt-4 text-xs bg-muted p-4 rounded overflow-auto">
            {JSON.stringify(projectError, null, 2)}
          </pre>
        )}
      </div>
    )
  }

  // Check if project belongs to user's company
  const isOwnProject = project.company_id && userData.company_id && project.company_id === userData.company_id

  // If project is archived and not own project, redirect to dashboard
  if (project.status === 'ARCHIVED' && !isOwnProject) {
    redirect('/company/dashboard')
  }

  // Only fetch applications if it's the user's own project
  let totalApplicants = 0
  let toReview = 0
  let accepted = 0
  let rejected = 0
  let allApplications: any[] = []

  if (isOwnProject) {
    // Application counts
    const [totalResult, reviewResult, acceptedResult, rejectedResult] = await Promise.all([
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'SUBMITTED'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'ACCEPTED'),
      supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'REJECTED'),
    ])

    totalApplicants = totalResult.count ?? 0
    toReview = reviewResult.count ?? 0
    accepted = acceptedResult.count ?? 0
    rejected = rejectedResult.count ?? 0

    // Fetch all applications with full details
    const { data: applications } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        design_doc_url,
        answers,
        team_lead_id,
        users(
          name,
          email,
          student_profiles(grad_date)
        ),
        team_members(
          student_id,
          is_lead,
          invite_status,
          confirmed_at,
          users(
            name,
            email,
            student_profiles(
              grad_date,
              resume_url,
              interests,
              description
            )
          )
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    allApplications = applications || []
  }

  const impressions = project.view_count ?? 0
  
  // Check if current user is the creator (only for own projects)
  const isCreator = isOwnProject && project.created_by_id === user.id



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Track view */}
      <ViewTracker projectId={id} />
      
      {/* Hero */}
      <div className="space-y-3">
        {project.status && (
          <StatusBadge status={project.status as any} className="uppercase tracking-wide" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold leading-tight flex-1">{project.title}</h1>
          {/* Only show edit button if user created this project */}
          {isCreator && (
            <ProjectEditToolbar
              project={{
                id: project.id,
                title: project.title,
                short_summary: project.short_summary,
                detailed_description: project.detailed_description,
                deliverables: project.deliverables,
                resource_links: project.resource_links,
              }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(project.project_type || []).map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
        {project.short_summary && (
          <p className="text-muted-foreground text-base">{project.short_summary}</p>
        )}
      </div>

      {/* Stats Row with Animated Numbers - Only show for own projects */}
      {isOwnProject && (
        <ProjectStats 
          totalApplicants={totalApplicants ?? 0}
          toReview={toReview ?? 0}
          impressions={impressions}
        />
      )}

      {/* Applications Table - Only show for own projects */}
      {isOwnProject && (
        <ProjectApplicationsTable 
          applications={allApplications as any[]} 
          projectId={id}
          project={project}
        />
      )}

      {/* Bento Grid */}
      <BentoGrid className="gap-6">

        {/* Description */}
        <BentoModalItem 
          className="md:col-span-3"
          title="Description" 
          icon={<FileText className="h-4 w-4" />}
          modalMaxWidth="max-w-4xl"
        >
          <p className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
            {project.detailed_description || 'No description provided.'}
          </p>
        </BentoModalItem>
        
        {/* Details (Fixed: simple grid without nested Cards) */}
        <BentoModalItem className="md:col-span-2" icon={<Users className="h-4 w-4" />} title="Details">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {/* Team Size */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
              <div className="text-xs text-muted-foreground mb-1">Team Size</div>
              <div className="text-lg font-medium">{project.min_students ?? '—'}–{project.max_students ?? '—'}</div>
            </div>

            {/* Max Teams */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
              <div className="text-xs text-muted-foreground mb-1">Max Teams</div>
              <div className="text-lg font-medium">{project.max_teams ? project.max_teams : 'Unlimited'}</div>
            </div>

            {/* Weekly Hours */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md">
              <div className="text-xs text-muted-foreground mb-1">Weekly Hours</div>
              <div className="text-lg font-medium">{project.weekly_hours ? `${project.weekly_hours}/wk` : '—'}</div>
            </div>

            {/* Timeline */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md min-h-[120px]">
              <div className="text-xs text-muted-foreground mb-1">Timeline</div>
              <div className="text-lg font-medium">
                    <div className="inline-flex cursor-default items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(project.start_date)} to {formatDate(project.end_date)}</span>
                    </div>
              </div>
            </div>

            {/* Access */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md min-h-[120px]">
              <div className="text-xs text-muted-foreground mb-1">Access</div>
              <div className="text-lg font-medium">
                {project.access_type
                  ? (project.access_type === 'CLOSED' ? 'Selective' : project.access_type.charAt(0).toUpperCase() + project.access_type.slice(1).toLowerCase())
                  : '—'}
              </div>
            </div>

            {/* Collaboration */}
            <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md min-h-[120px]">
              <div className="text-xs text-muted-foreground mb-2">Collaboration</div>
              <div className="flex flex-wrap gap-2">
                {project.collaboration_style && (
                  <Badge variant="outline">{project.collaboration_style}</Badge>
                )}
                {project.location && project.location.toLowerCase() !== project.collaboration_style?.toLowerCase() && (
                  <Badge variant="outline">{project.location}</Badge>
                )}
                {project.mentorship && (
                  <Badge variant="outline">Mentorship: {project.mentorship}</Badge>
                )}
              </div>
            </div>

          </div>
        </BentoModalItem>

        {/* Deliverables */}
        <BentoModalItem 
          title="Deliverables" 
          icon={<Target className="h-4 w-4" />}
          modalMaxWidth="max-w-3xl"
        >
          <p className="text-sm whitespace-pre-wrap">
            {project.deliverables || 'No deliverables specified.'}
          </p>
        </BentoModalItem>

        {/* Confidentiality & Contact */}
        <BentoModalItem 
          title="Confidentiality & Contact" 
          icon={<Shield className="h-4 w-4" />}
          modalTitle="Confidentiality & Contact Information"
          modalMaxWidth="max-w-2xl"
        >
          <div className="space-y-3 text-sm">
            <div>
              <div className="text-muted-foreground">Confidentiality</div>
              <div className="font-medium">
                {getConfidentialityLabel(project.confidentiality)}
              </div>
            </div>
            {isOwnProject && (
              <>
                <div>
                  <div className="text-muted-foreground">Contact</div>
                  <div className="font-medium">{project.contact_name || '—'}</div>
                  <div className="text-muted-foreground">{project.contact_role || '—'}</div>
                  <div className="text-muted-foreground">{project.contact_email || '—'}</div>
                </div>
                {project.internal_notes && (
                  <div className="pt-3 border-t border-neutral-200 dark:border-white/[0.2]">
                    <div className="text-muted-foreground mb-1">Internal Notes</div>
                    <div className="text-sm whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                      {project.internal_notes}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </BentoModalItem>

        {/* Resources */}
        <BentoModalItem 
          className="md:col-span-2" 
          title="Resources" 
          icon={<LinkIcon className="h-4 w-4" />}
          modalMaxWidth="max-w-4xl"
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Links</div>
              <ResourceLinks value={project.resource_links} />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Files</div>
              <ResourceFiles files={project.resource_files || []} projectId={project.id} />
            </div>
          </div>
        </BentoModalItem>
      </BentoGrid>

      {/* Skills */}
      <BentoModalItem
        className="md:max-h-[12rem]"
        icon={<Brain className="h-4 w-4" />}
        title="Skills"
      >
        <div className="flex flex-wrap gap-2">
          {(project.skills_needed || []).length > 0 ? (
            (project.skills_needed || []).map((skill) => (
              <Badge key={skill} variant="secondary">{skill}</Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No skills specified</span>
          )}
        </div>
      </BentoModalItem>
    </div>
  )
}


