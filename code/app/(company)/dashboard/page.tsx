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

  const company = userData?.company as { name: string } | null
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

  // Fetch all company projects
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, status')
    .eq('company_id', companyId)

  const projectIds = (allProjects || []).map((p) => p.id)
  const totalProjects = allProjects?.length || 0
  const activeProjects = allProjects?.filter(
    (p) => p.status === 'OPEN' || p.status === 'IN_PROGRESS'
  ).length || 0

  // Fetch all applications to company's projects
  let allApplications: any[] = []
  let pendingApplications = 0
  
  if (projectIds.length > 0) {
    const { data: applications } = await supabase
      .from('applications')
      .select('id, created_at, status')
      .in('project_id', projectIds)

    allApplications = applications || []
    pendingApplications = applications?.filter((a) => a.status === 'SUBMITTED').length || 0
  }

  // Aggregate applications data for chart (last 90 days)
  const chartData = aggregateApplicationsByDate(allApplications, 90)

  // Fetch recent SUBMITTED applications with details
  let newApplications: any[] = []
  
  if (projectIds.length > 0) {
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
    totalProjects,
    activeProjects,
    pendingApplications,
    totalViews: 0, // Placeholder for future implementation
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
