'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/client';

interface CompanyBreadcrumbsProps {
  companyName: string;
}

export function CompanyBreadcrumbs({ companyName }: CompanyBreadcrumbsProps) {
  const pathname = usePathname();
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  
  // Extract project ID if on a project page
  const projectId = pathname.startsWith('/company/projects/') && pathname !== '/company/projects/new' 
    ? pathname.split('/')[3] 
    : null;
  
  // Fetch project title if viewing a project
  useEffect(() => {
    if (!projectId) {
      setProjectTitle(null);
      return;
    }
    
    const fetchProjectTitle = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('projects')
        .select('title')
        .eq('id', projectId)
        .single();
      
      if (data) {
        setProjectTitle(data.title);
      }
    };
    
    fetchProjectTitle();
  }, [projectId]);
  
  // Determine the current page name based on pathname
  const getPageInfo = () => {
    if (pathname === '/company/dashboard') return { main: 'Dashboard' };
    if (pathname === '/company/browse' || pathname.startsWith('/company/browse')) return { main: 'Browse' };
    if (pathname === '/company/settings') return { main: 'Settings' };
    if (pathname === '/company/projects/new') return { main: 'New Project' };
    if (projectId) {
      const isEditPage = pathname.includes('/edit');
      return { 
        main: projectTitle || 'Loading...',
        sub: isEditPage ? 'Edit' : undefined,
      };
    }
    return { main: 'Overview' };
  };
  
  const pageInfo = getPageInfo();
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{companyName}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageInfo.main}</BreadcrumbPage>
        </BreadcrumbItem>
        {pageInfo.sub && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageInfo.sub}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

