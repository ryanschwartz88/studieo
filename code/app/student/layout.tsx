import { requireAuth, requireRole, requireOnboarding } from '@/lib/supabase/auth-helpers';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjectsMenu } from './_components/ProjectsMenu';
import { ApplicationsMenu } from './_components/ApplicationsMenu';
import { NavigationButtons } from './_components/NavigationButtons';
import { ThemeSwitcher } from '../company/_components/ThemeSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/actions/auth';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { StudentBreadcrumbs } from './_components/StudentBreadcrumbs';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Require authentication
  await requireAuth();
  
  // 2. Require STUDENT role
  await requireRole('STUDENT');
  
  // 3. Require onboarding to be complete
  await requireOnboarding();
  
  // 4. Fetch student data
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let projects: { applicationId: string; projectId: string; projectTitle: string; applicationStatus: string }[] = [];
  let applications: { id: string; projectId: string; projectTitle: string; status: string }[] = [];
  let userName = user?.email?.split('@')[0] || 'Student';
  let schoolName = 'Student';
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    
    if (userData?.name) {
      userName = userData.name;
    }
    
    // Fetch school name from email domain
    if (user.email) {
      const emailDomain = user.email.split('@')[1];
      const { data: schoolData } = await supabase
        .from('allowed_school_domains')
        .select('school_name')
        .eq('domain', emailDomain)
        .eq('active', true)
        .single();
      
      if (schoolData?.school_name) {
        schoolName = schoolData.school_name;
      }
    }
    
    // Fetch projects where student has accepted applications (as team lead)
    // Show all projects where application status is ACCEPTED, regardless of project status
    const { data: leadProjectsData, error: leadError } = await supabase
      .from('applications')
      .select('id, status, project_id, projects(id, title, status)')
      .eq('team_lead_id', user.id)
      .eq('status', 'ACCEPTED')
      .order('updated_at', { ascending: false });
    
    if (leadError) {
      console.error('Error fetching lead projects:', leadError);
    }
    
    
    // Fetch projects where student is a team member
    // Show all projects where application status is ACCEPTED, regardless of project status
    const { data: memberProjectsData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        application_id,
        applications!inner(
          id,
          status,
          project_id,
          projects(id, title, status)
        )
      `)
      .eq('student_id', user.id)
      .eq('invite_status', 'ACCEPTED')
      .eq('applications.status', 'ACCEPTED');
    
    if (memberError) {
      console.error('Error fetching member projects:', memberError);
    }
    
    // Combine and deduplicate projects
    const projectsMap = new Map();
    
    if (leadProjectsData) {
      leadProjectsData
        .filter(app => app.projects && 'title' in app.projects)
        .forEach(app => {
          const project = app.projects as unknown as { id: string; title: string; status: string };
          // Use project status for display (ACCEPTING, IN_PROGRESS, COMPLETED, etc.)
          const displayStatus = project.status || 'ACCEPTED';
          projectsMap.set(app.id, {
            applicationId: app.id,
            projectId: project.id,
            projectTitle: project.title,
            applicationStatus: displayStatus,
          });
        });
    }
    
    if (memberProjectsData) {
      memberProjectsData
        .filter(item => {
          const app = item.applications as any;
          return app?.projects && 'title' in app.projects;
        })
        .forEach(item => {
          const app = item.applications as any;
          const project = app.projects as { id: string; title: string; status: string };
          if (!projectsMap.has(app.id)) {
            // Use project status for display (ACCEPTING, IN_PROGRESS, COMPLETED, etc.)
            const displayStatus = project.status || 'ACCEPTED';
            projectsMap.set(app.id, {
              applicationId: app.id,
              projectId: project.id,
              projectTitle: project.title,
              applicationStatus: displayStatus,
            });
          }
        });
    }
    
    projects = Array.from(projectsMap.values());
    
    
    // Fetch active applications (pending or submitted) - as team lead
    const { data: leadApplicationsData } = await supabase
      .from('applications')
      .select('id, status, project_id, projects(id, title)')
      .eq('team_lead_id', user.id)
      .in('status', ['PENDING', 'SUBMITTED'])
      .order('updated_at', { ascending: false });
    
    // Fetch active applications where student is a team member (including PENDING invites)
    const { data: memberApplicationsData } = await supabase
      .from('team_members')
      .select(`
        application_id,
        invite_status,
        applications!inner(
          id,
          status,
          project_id,
          projects(id, title)
        )
      `)
      .eq('student_id', user.id)
      .in('invite_status', ['PENDING', 'ACCEPTED'])
      .in('applications.status', ['PENDING', 'SUBMITTED']);
    
    // Combine and deduplicate applications
    const applicationsMap = new Map();
    
    if (leadApplicationsData) {
      leadApplicationsData
        .filter(app => app.projects && 'title' in app.projects)
        .forEach(app => {
          const project = app.projects as unknown as { id: string; title: string };
          applicationsMap.set(app.id, {
            id: app.id,
            projectId: project.id,
            projectTitle: project.title,
            status: app.status,
          });
        });
    }
    
    if (memberApplicationsData) {
      memberApplicationsData
        .filter(item => {
          const app = item.applications as any;
          return app?.projects && 'title' in app.projects;
        })
        .forEach(item => {
          const app = item.applications as any;
          const project = app.projects as { id: string; title: string };
          if (!applicationsMap.has(app.id)) {
            applicationsMap.set(app.id, {
              id: app.id,
              projectId: project.id,
              projectTitle: project.title,
              status: app.status,
            });
          }
        });
    }
    
    applications = Array.from(applicationsMap.values());
  }
  
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S';
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/student/dashboard">
                  <div className="flex aspect-square size-6 items-center justify-center rounded-lg">
                    <Image
                      src="/Studieo Logo/Icon-Light.svg"
                      alt="Studieo"
                      width={24}
                      height={24}
                      priority
                      className="dark:hidden"
                    />
                    <Image
                      src="/Studieo Logo/Icon-Dark.svg"
                      alt="Studieo"
                      width={24}
                      height={24}
                      priority
                      className="hidden dark:block"
                    />
                  </div>
                  <div className="flex flex-1 items-end text-left text-xl font-bold leading-tight uppercase">
                    <span className="truncate font-bold" style={{ letterSpacing: '0.15em' }}>Studieo</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavigationButtons />
          <ProjectsMenu projects={projects} count={projects.length} maxCount={3} />
          <ApplicationsMenu applications={applications} count={applications.length} maxCount={20} />
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{userName}</span>
                      <span className="truncate text-xs">{schoolName}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" sideOffset={4}>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarFallback className="rounded-lg text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{userName}</span>
                        <span className="truncate text-xs">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/student/profile">Account</Link>
                  </DropdownMenuItem>
                  <ThemeSwitcher />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <form action={signOut} className="w-full">
                      <button type="submit" className="flex w-full items-center gap-2 text-left">
                        <LogOut className="text-muted-foreground" size={16}/>
                        <span>Log out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 bg-background border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <StudentBreadcrumbs studentName={userName} />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
