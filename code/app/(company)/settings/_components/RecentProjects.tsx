'use client';

import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Carousel } from '@/components/ui/apple-cards-carousel';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';

type Project = {
  id: string;
  title: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  created_by_id: string;
  users: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

interface RecentProjectsProps {
  projects: Project[];
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

const getInitials = (name: string | null, email: string) => {
  if (name) {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email[0].toUpperCase();
};

export function RecentProjects({ projects }: RecentProjectsProps) {
  const router = useRouter();
  
  if (projects.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      </div>
    );
  }
  
  const projectCards = projects.map((project) => (
    <Card
      key={project.id}
      className="cursor-pointer hover:shadow-lg transition-shadow w-80 flex-shrink-0"
      onClick={() => router.push(`/projects/${project.id}`)}
      data-testid={`project-card-${project.id}`}
    >
      <CardHeader>
        <StatusBadge status={project.status || undefined} className="mb-2" />
        <CardTitle className="line-clamp-2">{project.title || 'Untitled Project'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {formatTimeline(project.start_date, project.end_date)}
        </p>
        {project.users && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {getInitials(project.users.name, project.users.email)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground truncate">
              Created by {project.users.name || project.users.email}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  ));
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
      <Carousel items={projectCards} />
    </div>
  );
}

