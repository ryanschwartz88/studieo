import { requireAuth, requireRole } from '@/lib/supabase/auth-helpers';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarRail, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarSeparator } from '@/components/ui/sidebar';
import { Home, Briefcase, Users, Settings } from 'lucide-react';

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Require authentication
  await requireAuth();
  
  // 2. Require COMPANY role
  await requireRole('COMPANY');
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-3 py-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="font-semibold">Studieo</span>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Company</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/dashboard"><Home className="mr-2" /> Dashboard</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/projects"><Briefcase className="mr-2" /> Projects</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/teams"><Users className="mr-2" /> Applicants</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/settings"><Settings className="mr-2" /> Settings</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

