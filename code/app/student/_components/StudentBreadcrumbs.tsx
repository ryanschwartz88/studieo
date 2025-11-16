'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { createClient } from '@/lib/supabase/client';

interface StudentBreadcrumbsProps {
  studentName: string;
}

export function StudentBreadcrumbs({ studentName }: StudentBreadcrumbsProps) {
  const pathname = usePathname();
  const [projectTitle, setProjectTitle] = useState<string | null>(null);
  
  // Extract project ID if on a project page
  const projectId = pathname.startsWith('/student/projects/') 
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
    if (pathname === '/student/dashboard') return { main: 'Dashboard' };
    if (pathname.startsWith('/student/search')) return { main: 'Browse' };
    if (pathname === '/student/profile') return { main: 'Profile' };
    if (projectId) {
      return { 
        main: projectTitle || 'Loading...',
      };
    }
    return { main: 'Overview' };
  };
  
  const pageInfo = getPageInfo();
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbPage className="font-semibold">{studentName}</BreadcrumbPage>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{pageInfo.main}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

