import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { BentoGrid } from '@/components/ui/bento-grid'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ApplyButton } from './_components/ApplyButton'
import { BookmarkButton } from './_components/BookmarkButton'
import { ApplicationViewSheet } from './_components/ApplicationViewSheet'
import { ResourceLinks } from '@/app/company/projects/[id]/_components/ResourceLinks'
import { ResourceFiles } from '@/app/company/projects/[id]/_components/ResourceFiles'
import { BentoModalItem } from '@/app/company/projects/[id]/_components/BentoModalItem'
import { CalendarIcon, Users, Target, Shield, Link as LinkIcon, FileText, Brain, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { getSavedProjects } from '@/lib/actions/saved-projects'
import { checkStudentLimits } from '@/lib/actions/applications'

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
  location: string | null
  view_count: number | null
  custom_questions?: { id: string; question: string; required: boolean }[] | null
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
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

export default async function StudentProjectPage({ params }: ProjectPageProps) {
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

  // Get user role and profile info
  const { data: userData } = await supabase
    .from('users')
    .select('role, name, email')
    .eq('id', user.id)
    .single()

  if (!userData || userData.role !== 'STUDENT') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p className="text-sm text-muted-foreground mt-2">Only students can view projects from this page.</p>
      </div>
    )
  }

  // Check if student has an accepted application for this project (as team lead OR team member)
  const { data: acceptedApplicationAsLead } = await supabase
    .from('applications')
    .select('id, status')
    .eq('project_id', id)
    .eq('team_lead_id', user.id)
    .eq('status', 'ACCEPTED')
    .maybeSingle()

  const { data: acceptedApplicationAsMember } = await supabase
    .from('team_members')
    .select('application_id, applications(id, status, project_id)')
    .eq('student_id', user.id)
    .eq('invite_status', 'ACCEPTED')

  const hasAcceptedApplicationAsMember = acceptedApplicationAsMember?.some(
    (tm: any) => tm.applications?.project_id === id && tm.applications?.status === 'ACCEPTED'
  )

  const hasAcceptedApplication = !!acceptedApplicationAsLead || !!hasAcceptedApplicationAsMember

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select(
      [
        'id','title','short_summary','detailed_description','deliverables',
        'project_type','access_type','min_students','max_students','weekly_hours',
        'max_teams','skills_needed','collaboration_style',
        'mentorship','start_date','end_date','resource_links','resource_files',
        'contact_name','contact_role','contact_email','confidentiality','status','company_id',
        'location','view_count','custom_questions',
      ].join(',')
    )
    .eq('id', id)
    // Students can view ACCEPTING projects or projects they have accepted applications for
    .single<Project>()

  if (projectError || !project) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="text-sm text-muted-foreground mt-2">
          The project you are looking for does not exist or is not currently accepting applications.
        </p>
      </div>
    )
  }

  // Check if user already has an application for this project (as lead or member)
  const { data: existingApplicationAsLead } = await supabase
    .from('applications')
    .select(`
      id, 
      status, 
      created_at, 
      submitted_at,
      design_doc_url,
      answers,
      team_members(
        student_id,
        is_lead,
        invite_status,
        confirmed_at,
        users(name, email)
      )
    `)
    .eq('project_id', id)
    .eq('team_lead_id', user.id)
    .maybeSingle()

  const { data: existingApplicationAsMember } = await supabase
    .from('team_members')
    .select(`
      student_id,
      is_lead,
      invite_status,
      confirmed_at,
      applications(
        id,
        status,
        created_at,
        submitted_at,
        design_doc_url,
        answers,
        project_id,
        team_members(
          student_id,
          is_lead,
          invite_status,
          confirmed_at,
          users(name, email)
        )
      )
    `)
    .eq('student_id', user.id)

  const existingApplicationAsMemberData = existingApplicationAsMember?.find(
    (tm: any) => tm.applications?.project_id === id
  )

  // Normalize existing application shape (lead or member) to a single object
  const existingApplication =
    (existingApplicationAsLead as any) ||
    (existingApplicationAsMemberData ? (existingApplicationAsMemberData.applications as any) : null)

  // Check if project is saved
  const savedProjects = await getSavedProjects()
  const isSaved = savedProjects.includes(id)

  // Get student limits
  const studentLimits = await checkStudentLimits(user.id)

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

  const impressions = project.view_count ?? 0
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">

      {/* Hero */}
      <div className="space-y-3">
        {/* Status Badge */}
        {project.status && (
          <StatusBadge status={project.status as any} className="uppercase tracking-wide" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold leading-tight flex-1">{project.title}</h1>
          
          {/* Apply Button or Status Badge */}
          {existingApplication ? (
            <div className="flex flex-col items-end gap-2">
              {existingApplication.status === 'PENDING' && (
                <Badge variant="outline" className="border-amber-500 text-amber-700 uppercase tracking-wide">
                  Pending Team Approval
                </Badge>
              )}
              {existingApplication.status === 'SUBMITTED' && (
                <Badge variant="outline" className="border-blue-500 text-blue-700 uppercase tracking-wide">
                  Under Review
                </Badge>
              )}
              {existingApplication.status === 'ACCEPTED' && (
                <Badge variant="outline" className="border-green-500 text-green-700 uppercase tracking-wide">
                  Accepted
                </Badge>
              )}
              {existingApplication.status === 'REJECTED' && (
                <Badge variant="outline" className="border-red-500 text-red-700 uppercase tracking-wide">
                  Not Selected
                </Badge>
              )}
            </div>
          ) : project.status === 'ACCEPTING' ? (
            <ApplyButton 
              project={{
                id: project.id,
                title: project.title,
                min_students: project.min_students,
                max_students: project.max_students,
                custom_questions: project.custom_questions,
              }} 
              studentLimits={studentLimits}
              currentUser={currentUser}
            />
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">
                This project is no longer accepting applications
              </p>
            </div>
          )}

          {/* Bookmark Button */}
          <BookmarkButton projectId={id} initialSaved={isSaved} />
          
        </div>
        {project.short_summary && (
          <p className="text-muted-foreground text-base">{project.short_summary}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {(project.project_type || []).map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      </div>

      {/* Application Status Alert */}
      {existingApplication && existingApplication.status === 'PENDING' && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-amber-900 dark:text-amber-100 mb-1">Application In Progress</AlertTitle>
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Created on {formatDate(existingApplication.created_at)}
                  {' • '}
                  {(() => {
                    const totalMembers = existingApplication.team_members?.length || 0
                    const confirmedMembers = existingApplication.team_members?.filter((m: any) => m.invite_status === 'ACCEPTED').length || 0
                    const isLead = existingApplicationAsLead !== null
                    
                    if (totalMembers === confirmedMembers) {
                      return 'All team members confirmed'
                    }
                    
                    const currentUserMember = existingApplication.team_members?.find((m: any) => m.student_id === user.id)
                    const userHasConfirmed = currentUserMember?.invite_status === 'ACCEPTED'
                    
                    if (isLead) {
                      return `${confirmedMembers} of ${totalMembers} members confirmed`
                    } else if (userHasConfirmed) {
                      return `${confirmedMembers} of ${totalMembers} members confirmed`
                    } else {
                      return `Action required: Please confirm your participation`
                    }
                  })()}
                </AlertDescription>
              </div>
              <div className="flex-shrink-0">
                <ApplicationViewSheet
                  application={existingApplication as any}
                  currentUserId={user.id}
                  projectTitle={project.title || 'Project'}
                  customQuestions={project.custom_questions}
                />
              </div>
            </div>
          </div>
        </Alert>
      )}

      {existingApplication && existingApplication.status === 'SUBMITTED' && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-blue-900 dark:text-blue-100 mb-1">Application Submitted</AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Submitted on {formatDate(existingApplication.submitted_at || existingApplication.created_at)}
                  {project.access_type === 'OPEN' 
                    ? ' • This project auto-approves applications'
                    : ' • Waiting for review'
                  }
                </AlertDescription>
              </div>
              <div className="flex-shrink-0">
                <ApplicationViewSheet
                  application={existingApplication as any}
                  currentUserId={user.id}
                  projectTitle={project.title || 'Project'}
                  customQuestions={project.custom_questions}
                />
              </div>
            </div>
          </div>
        </Alert>
      )}

      {existingApplication && existingApplication.status === 'ACCEPTED' && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-green-900 dark:text-green-100 mb-1">Application Accepted!</AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Congratulations! Your application has been accepted. Contact information is now visible below.
                </AlertDescription>
              </div>
              <div className="flex-shrink-0">
                <ApplicationViewSheet
                  application={existingApplication as any}
                  currentUserId={user.id}
                  projectTitle={project.title || 'Project'}
                  customQuestions={project.custom_questions}
                />
              </div>
            </div>
          </div>
        </Alert>
      )}

      {existingApplication && existingApplication.status === 'REJECTED' && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 [&>svg]:relative [&>svg]:left-0 [&>svg]:top-0">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0" />
            <div className="flex items-center justify-between gap-4 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-red-900 dark:text-red-100 mb-1">Application Not Selected</AlertTitle>
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Your application was not selected for this project. Keep exploring other opportunities!
                </AlertDescription>
              </div>
              <div className="flex-shrink-0">
                <ApplicationViewSheet
                  application={existingApplication as any}
                  currentUserId={user.id}
                  projectTitle={project.title || 'Project'}
                  customQuestions={project.custom_questions}
                />
              </div>
            </div>
          </div>
        </Alert>
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
        
        {/* Details */}
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
                {/* Only show location if it's different from collaboration_style (avoid double "Remote") */}
                {project.location && 
                 project.location.toLowerCase() !== project.collaboration_style?.toLowerCase() && (
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
          title="Contact & Confidentiality" 
          icon={<Shield className="h-4 w-4" />}
          modalTitle="Contact & Confidentiality Information"
          modalMaxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-sm">
            {/* Contact Info - Blurred unless accepted */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Information</div>
              {hasAcceptedApplication ? (
                <>
                  <div>
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium">{project.contact_name || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Role</div>
                    <div className="font-medium">{project.contact_role || '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{project.contact_email || '—'}</div>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <div className="space-y-3 select-none pointer-events-none">
                    <div>
                      <div className="text-muted-foreground">Name</div>
                      <div className="font-medium blur-sm">{project.contact_name || 'John Doe'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Role</div>
                      <div className="font-medium blur-sm">{project.contact_role || 'Product Manager'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium blur-sm">{project.contact_email || 'contact@company.com'}</div>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-muted text-center">
                      <p className="text-xs font-medium">Visible after acceptance</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confidentiality */}
            <div className="pt-3 border-t">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Confidentiality</div>
              <div className="font-medium">
                {getConfidentialityLabel(project.confidentiality)}
              </div>
            </div>
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

