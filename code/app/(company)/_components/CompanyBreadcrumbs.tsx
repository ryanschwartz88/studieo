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
  const projectId = pathname.startsWith('/projects/') && pathname !== '/projects/new' 
    ? pathname.split('/')[2] 
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
    if (pathname === '/dashboard') return { main: 'Dashboard' };
    if (pathname === '/browse') return { main: 'Browse' };
    if (pathname === '/settings') return { main: 'Settings' };
    if (pathname === '/projects/new') return { main: 'New Project' };
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

