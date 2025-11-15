import { requireAuth, requireRole } from '@/lib/supabase/auth-helpers';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarRail, SidebarGroup } from '@/components/ui/sidebar';
import { ChevronsUpDown, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ProjectsMenu } from './_components/ProjectsMenu';
import { NavigationButtons } from './_components/NavigationButtons';
import { ThemeSwitcher } from './_components/ThemeSwitcher';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/lib/actions/auth';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { CompanyBreadcrumbs } from './_components/CompanyBreadcrumbs';

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Require authentication
  await requireAuth();
  
  // 2. Require COMPANY role
  await requireRole('COMPANY');
  
  // 3. Fetch company projects (company-wide scope)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let projects: { id: string; title: string; status: string; created_by_id: string | null }[] = [];
  let pendingCounts: Record<string, number> = {};
  let userName = user?.email?.split('@')[0] || 'User';
  let companyName = 'Company';
  
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('name, company_id, companies(name)')
      .eq('id', user.id)
      .single();
    
    if (userData?.name) {
      userName = userData.name;
    }
    
    if (userData?.companies && 'name' in userData.companies) {
      companyName = (userData.companies as { name: string }).name;
    }
    
    if (userData?.company_id) {
      const { data } = await supabase
        .from('projects')
        .select('id, title, status, created_by_id')
        .eq('company_id', userData.company_id)
        .neq('status', 'ARCHIVED')
        .order('updated_at', { ascending: false });
      
      projects = data ?? [];

      // fetch submitted applications per project for badges
      const projectIds = (projects ?? []).map(p => p.id);
      if (projectIds.length > 0) {
        const { data: appRows } = await supabase
          .from('applications')
          .select('project_id')
          .in('project_id', projectIds)
          .eq('status', 'SUBMITTED');
        if (appRows) {
          for (const row of appRows as { project_id: string }[]) {
            pendingCounts[row.project_id] = (pendingCounts[row.project_id] || 0) + 1;
          }
        }
      }
    }
  }
  
  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';
  
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/company/dashboard">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
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
                  <div className="grid flex-1 text-left text-lg font-semibold leading-tight uppercase">
                    <span className="truncate font-semibold">Studieo</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavigationButtons />
          <ProjectsMenu projects={projects} pendingCounts={pendingCounts} />
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
                      <span className="truncate text-xs">{companyName}</span>
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
                    <Link href="/company/settings">Account</Link>
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
            <CompanyBreadcrumbs companyName={companyName} />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

