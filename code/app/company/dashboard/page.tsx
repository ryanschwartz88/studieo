import { createClient } from '@/lib/supabase/server'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { DashboardClient } from './_components/DashboardClient'
import { aggregateApplicationsByDate } from './_components/utils'

export default async function CompanyDashboardPage() {
  const supabase = await createClient()
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="w-full p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view your dashboard.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get user's company info
  const { data: userData } = await supabase
    .from('users')
    .select('name, company_id, company:companies(name)')
    .eq('id', user.id)
    .single()

  const company = userData?.company as unknown as { name: string } | null
  const companyId = userData?.company_id

  if (!companyId || !company) {
    return (
      <div className="w-full p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Company Not Found</AlertTitle>
          <AlertDescription>
            Your account is not associated with a company.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 1. Get active projects count
  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('status', ['ACCEPTING', 'IN_PROGRESS'])

  const activeProjects = activeProjectsCount || 0

  // 2. Get total views across all projects
  // We can use a sum aggregation if we had a function, but for now we'll fetch just the view_count column
  // which is much lighter than fetching all columns.
  const { data: projectViews } = await supabase
    .from('projects')
    .select('view_count')
    .eq('company_id', companyId)

  const totalViews = projectViews?.reduce((sum, p) => sum + (p.view_count || 0), 0) || 0

  // 3. Get project IDs for application queries
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('company_id', companyId)
  
  const projectIds = projects?.map(p => p.id) || []

  let pendingApplications = 0
  let viewToApplyRate = 0
  let chartData: any[] = []
  let newApplications: any[] = []

  if (projectIds.length > 0) {
    // 4. Get pending applications count
    const { count: pendingCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'SUBMITTED')
    
    pendingApplications = pendingCount || 0

    // 5. Get total applications count for rate calculation
    const { count: totalAppsCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)

    viewToApplyRate = totalViews > 0 ? ((totalAppsCount || 0) / totalViews) * 100 : 0

    // 6. Get applications for chart (last 90 days only)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    
    const { data: recentApplications } = await supabase
      .from('applications')
      .select('created_at, status')
      .in('project_id', projectIds)
      .gte('created_at', ninetyDaysAgo.toISOString())

    // Aggregate applications data for chart
    chartData = aggregateApplicationsByDate(recentApplications || [], 90)

    // 7. Fetch recent SUBMITTED applications with details (limit 10)
    const { data: recentApps } = await supabase
      .from('applications')
      .select(`
        id,
        created_at,
        status,
        team_lead_id,
        project_id,
        projects:project_id (
          id,
          title,
          project_type
        ),
        users:team_lead_id (
          name,
          email
        )
      `)
      .eq('status', 'SUBMITTED')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(10)

    newApplications = (recentApps || []).map((app) => ({
      id: app.id,
      created_at: app.created_at,
      status: app.status,
      projects: Array.isArray(app.projects) ? app.projects[0] : app.projects,
      users: Array.isArray(app.users) ? app.users[0] : app.users,
    }))
  }

  const stats = {
    viewToApplyRate,
    activeProjects,
    pendingApplications,
    totalViews,
  }

  return (
    <div className="w-full p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {company?.name || 'Company Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {userData?.name}! Track your projects and applications.
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <DashboardClient
        stats={stats}
        chartData={chartData}
        newApplications={newApplications}
      />
    </div>
  )
}
