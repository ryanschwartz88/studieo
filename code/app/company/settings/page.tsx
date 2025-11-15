import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CompanyHeader } from './_components/CompanyHeader';
import { RecentProjects } from './_components/RecentProjects';
import { TeamSearch } from './_components/TeamSearch';
import { Separator } from '@/components/ui/separator';

export default async function CompanySettingsPage() {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Verify user has COMPANY role and company_id
  const { data: userData } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single();
  
  if (!userData || userData.role !== 'COMPANY' || !userData.company_id) {
    redirect('/');
  }
  
  // Fetch company data
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, logo_url, domain, location')
    .eq('id', userData.company_id)
    .single();
  
  if (!company) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error</h1>
        <p className="text-sm text-muted-foreground mt-2">Company not found.</p>
      </div>
    );
  }
  
  // Fetch recent projects (last 6, ordered by created_at)
  const { data: recentProjectsRaw } = await supabase
    .from('projects')
    .select(`
      id,
      title,
      status,
      start_date,
      end_date,
      created_at,
      created_by_id,
      users!projects_created_by_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false })
    .limit(6);
  
  // Transform the data to match expected structure
  const recentProjects = recentProjectsRaw?.map((project: any) => ({
    ...project,
    users: Array.isArray(project.users) ? project.users[0] : project.users,
  })) || [];
  
  // Fetch all company users
  const { data: companyUsers } = await supabase
    .from('users')
    .select('id, name, email, role, created_at')
    .eq('company_id', userData.company_id)
    .order('created_at', { ascending: false });
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <CompanyHeader company={company} userCount={companyUsers?.length || 0} />
      <Separator className="my-6" />
      <RecentProjects projects={recentProjects || []} />
      <Separator className="my-6" />
      <TeamSearch users={companyUsers || []} />
    </div>
  );
}
