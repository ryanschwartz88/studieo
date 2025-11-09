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
        'internal_notes','location','view_count','created_by_id',
      ].join(',')
    )
    .eq('id', id)
    .single<Project>()

  // If project not found or error, show error page
  if (projectError || !project) {
    console.error('Project fetch error:', projectError)
    console.error('Project ID:', id)
    console.error('User company_id:', userData?.company_id)
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

  // Verify project belongs to user's company (RLS should handle this, but double-check)
  if (project.company_id && userData.company_id && project.company_id !== userData.company_id) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">You do not have permission to view this project.</p>
      </div>
    )
  }

  // If project is archived, redirect to dashboard
  if (project.status === 'ARCHIVED') {
    redirect('/dashboard')
  }

  // Application counts
  const [{ count: totalApplicants }, { count: toReview }, { count: accepted }, { count: rejected }] = await Promise.all([
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'SUBMITTED'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'ACCEPTED'),
    supabase.from('applications').select('*', { count: 'exact', head: true }).eq('project_id', id).eq('status', 'REJECTED'),
  ])

  const impressions = project.view_count ?? 0
  
  // Check if current user is the creator
  const isCreator = project.created_by_id === user.id

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Track view */}
      <ViewTracker projectId={id} />
      
      {/* Hero */}
      <div className="space-y-3">
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
          {project.status && (
            <StatusBadge status={project.status as any} className="uppercase tracking-wide" />
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

      {/* Stats Row with Animated Numbers */}
      <ProjectStats 
        totalApplicants={totalApplicants ?? 0}
        toReview={toReview ?? 0}
        impressions={impressions}
      />

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  ? project.access_type.charAt(0).toUpperCase() + project.access_type.slice(1).toLowerCase()
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
                {project.location && (
                  <Badge variant="outline">{project.location}</Badge>
                )}
                {project.mentorship && (
                  <Badge variant="outline">Mentorship: {project.mentorship}</Badge>
                )}
              </div>
            </div>

            {/* Skills */}
            {/* <div className="group p-3 rounded-lg border border-neutral-200 dark:border-white/[0.2] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-md col-span-1 sm:col-span-2 lg:col-span-3">
              <div className="text-xs text-muted-foreground mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">
                {(project.skills_needed || []).length > 0 ? (
                  (project.skills_needed || []).map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No skills specified</span>
                )}
              </div>
            </div> */}
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
                {project.confidentiality
                  ? project.confidentiality.charAt(0).toUpperCase() + project.confidentiality.slice(1).toLowerCase()
                  : '—'}
              </div>
            </div>
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


