'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Carousel } from '@/components/ui/apple-cards-carousel';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';
import Image from 'next/image';
import { useState } from 'react';

type SavedProject = {
  id: string;
  title: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  company_name: string | null;
  company_logo_url: string | null;
  saved_at: string;
};

interface SavedProjectsProps {
  projects: SavedProject[];
}

const formatTimeline = (start: string | null, end: string | null) => {
  if (!start || !end) return '—';
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
  } catch {
    return '—';
  }
};

const getCompanyInitials = (name: string | null) => {
  if (!name) return 'C';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

type ProjectCardData = {
  id: string;
  title: string | null;
  status: string | null;
  start_date?: string | null;
  end_date?: string | null;
  company_name: string | null;
  company_logo_url?: string | null;
};

export function ProjectCard({ project, onClick, className }: { 
  project: ProjectCardData; 
  onClick: () => void;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow ${className || ''}`}
      onClick={onClick}
      data-testid={`project-card-${project.id}`}
    >
      <CardHeader>
        <StatusBadge status={project.status || undefined} className="mb-2" />
        <CardTitle className="line-clamp-2">{project.title || 'Untitled Project'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(project.start_date || project.end_date) && (
          <p className="text-sm text-muted-foreground">
            {formatTimeline(project.start_date || null, project.end_date || null)}
          </p>
        )}
        {project.company_name && (
          <div className="flex items-center gap-2">
            {project.company_logo_url && !imageError ? (
              <Image
                src={project.company_logo_url}
                alt={project.company_name}
                width={24}
                height={24}
                className="w-6 h-6 rounded object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getCompanyInitials(project.company_name)}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-sm text-muted-foreground truncate">
              {project.company_name}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function SavedProjects({ projects }: SavedProjectsProps) {
  const router = useRouter();
  
  if (projects.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Saved Projects</h2>
        <p className="text-sm text-muted-foreground">No saved projects yet. Start exploring projects to bookmark them!</p>
      </div>
    );
  }
  
  const projectCards = projects.map((project) => (
    <ProjectCard
      key={project.id}
      project={project}
      onClick={() => router.push(`/student/projects/${project.id}`)}
      className="w-80 flex-shrink-0"
    />
  ));
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Saved Projects</h2>
      <Carousel items={projectCards} />
    </div>
  );
}

