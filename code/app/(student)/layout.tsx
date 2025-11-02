import { requireAuth, requireRole, requireOnboarding } from '@/lib/supabase/auth-helpers';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarRail, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarSeparator } from '@/components/ui/sidebar';
import { Home, FolderOpen, FileText, Settings } from 'lucide-react';

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
            <SidebarGroupLabel>Student</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/browse"><Home className="mr-2" /> Browse Projects</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/applications"><FolderOpen className="mr-2" /> My Applications</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/profile"><Settings className="mr-2" /> Profile</Link>
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

