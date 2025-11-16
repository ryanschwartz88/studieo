import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, TrendingUp, Briefcase, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

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

  // Fetch trending projects (top 6 by view count)
  const { data: trendingProjects } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      short_summary,
      project_type,
      view_count,
      min_students,
      max_students,
      company_id,
      companies(name, logo_url)
    `)
    .eq('status', 'ACCEPTING')
    .order('view_count', { ascending: false })
    .limit(6)

  // Fetch active applications (PENDING or SUBMITTED)
  const { data: activeApplications } = await supabase
    .from('team_members')
    .select(`
      application_id,
      invite_status,
      applications(
        id,
        status,
        created_at,
        submitted_at,
        project_id,
        projects(title, company_id, companies(name))
      )
    `)
    .eq('student_id', user.id)
    .in('applications.status', ['PENDING', 'SUBMITTED'])

  // Fetch accepted projects
  const { data: acceptedProjects } = await supabase
    .from('team_members')
    .select(`
      application_id,
      applications(
        id,
        status,
        project_id,
        projects(
          title,
          short_summary,
          contact_name,
          contact_email,
          company_id,
          companies(name)
        )
      )
    `)
    .eq('student_id', user.id)
    .eq('applications.status', 'ACCEPTED')

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
            <div className="text-2xl font-bold">{trendingProjects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently accepting applications
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accepted Projects */}
      {acceptedProjects && acceptedProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Projects</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {acceptedProjects.map((item) => {
              const app = item.applications as any
              const project = app?.projects
              const company = project?.companies
              
              return (
                <Card key={item.application_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{project?.title}</CardTitle>
                        <CardDescription>{company?.name}</CardDescription>
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project?.short_summary && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.short_summary}
                      </p>
                    )}
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Contact:</span>{' '}
                        <span className="text-muted-foreground">{project?.contact_name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Email:</span>{' '}
                        <a 
                          href={`mailto:${project?.contact_email}`}
                          className="text-primary hover:underline"
                        >
                          {project?.contact_email}
                        </a>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4"
                      asChild
                    >
                      <Link href={`/student/projects/${project?.id}`}>
                        View Project
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Applications */}
      {activeApplications && activeApplications.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Active Applications</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {activeApplications.map((item) => {
              const app = item.applications as any
              const project = app?.projects
              const company = project?.companies
              
              return (
                <Card key={item.application_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{project?.title}</CardTitle>
                        <CardDescription>{company?.name}</CardDescription>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          app?.status === 'SUBMITTED' 
                            ? 'border-blue-500 text-blue-700' 
                            : 'border-gray-500 text-gray-700'
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {app?.status === 'SUBMITTED' ? 'Under Review' : 'Draft'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm">
                        <span className="font-medium">Status:</span>{' '}
                        <span className="text-muted-foreground">
                          {app?.status === 'SUBMITTED' 
                            ? 'Awaiting company review' 
                            : 'Application in progress'
                          }
                        </span>
                      </div>
                      {item.invite_status === 'PENDING' && app?.status === 'SUBMITTED' && (
                        <div className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
                          <span className="font-medium">Action Required:</span> Confirm your participation
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      asChild
                    >
                      <Link href={`/student/projects/${project?.id}`}>
                        View Application
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Trending Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Trending Projects</h2>
          </div>
          <Button variant="outline" asChild>
            <Link href="/student/search">Browse All</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendingProjects?.map((project) => {
            const company = project.companies as any
            
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>{company?.name}</span>
                    <div className="flex items-center gap-1 text-xs">
                      <Eye className="h-3 w-3" />
                      {project.view_count}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.short_summary && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {project.short_summary}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.project_type?.slice(0, 2).map((type: string) => (
                      <Badge key={type} variant="secondary">
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <span>Team: {project.min_students}-{project.max_students}</span>
                  </div>
                  <Button variant="default" size="sm" className="w-full" asChild>
                    <Link href={`/student/projects/${project.id}`}>
                      View Project
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Empty State */}
      {!activeApplications?.length && !acceptedProjects?.length && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No active applications yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start exploring projects and apply to get started
            </p>
            <Button asChild>
              <Link href="/student/search">Browse Projects</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

