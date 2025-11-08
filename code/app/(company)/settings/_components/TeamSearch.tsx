'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getUserProjects } from '@/lib/actions/companies';
import { toast } from 'sonner';
import { Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from '@/components/ui/status-badge';

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: string;
};

type UserProject = {
  id: string;
  title: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

interface TeamSearchProps {
  users: User[];
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

function UserModal({ user }: { user: User }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && projects.length === 0) {
      setIsLoading(true);
      try {
        const result = await getUserProjects(user.id);
        setIsLoading(false);
        if (result.success && result.data) {
          console.log('Projects loaded:', result.data.length);
          setProjects(result.data);
        } else {
          console.error('Failed to load projects:', result.error);
          toast.error(result.error || 'Failed to load projects');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error loading projects:', error);
        toast.error('An error occurred while loading projects');
      }
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <BentoGridItem
            title={user.name || user.email}
            description={user.email}
            header={
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            }
            className="hover:shadow-lg transition-shadow"
            data-testid={`user-result-${user.id}`}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Member Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-xl">
                {getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{user.name || 'No name'}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Contact Information</h4>
            <a
              href={`mailto:${user.email}`}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              {user.email}
            </a>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Projects Created</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects created yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    data-testid={`user-modal-${user.id}`}
                    tabIndex={0}
                    role="button"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsOpen(false);
                        router.push(`/projects/${project.id}`);
                      }
                    }}
                    onClick={() => {
                      setIsOpen(false);
                      router.push(`/projects/${project.id}`);
                    }}
                    className="cursor-pointer hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-shadow"
                  >
                    <CardHeader>
                      <StatusBadge status={project.status || undefined} className="mb-2" />
                      <CardTitle className="text-base line-clamp-2">{project.title || 'Untitled Project'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeline(project.start_date, project.end_date)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TeamSearch({ users }: TeamSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Team Members</h2>
      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md mb-6"
        data-testid="user-search-input"
      />
      
      {filteredUsers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members found.</p>
      ) : (
        <BentoGrid>
          {filteredUsers.map((user) => (
            <UserModal key={user.id} user={user} />
          ))}
        </BentoGrid>
      )}
    </div>
  );
}

