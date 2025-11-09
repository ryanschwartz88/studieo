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
  
  // Extract application ID if on an application page
  const applicationId = pathname.startsWith('/applications/') 
    ? pathname.split('/')[2] 
    : null;
  
  // Fetch project title if viewing an application
  useEffect(() => {
    if (!applicationId) {
      setProjectTitle(null);
      return;
    }
    
    const fetchProjectTitle = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('applications')
        .select('projects(title)')
        .eq('id', applicationId)
        .single();
      
      if (data && data.projects && 'title' in data.projects) {
        setProjectTitle((data.projects as { title: string }).title);
      }
    };
    
    fetchProjectTitle();
  }, [applicationId]);
  
  // Determine the current page name based on pathname
  const getPageInfo = () => {
    if (pathname === '/dashboard') return { main: 'Dashboard' };
    if (pathname === '/browse') return { main: 'Browse' };
    if (pathname === '/profile') return { main: 'Profile' };
    if (applicationId) {
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

