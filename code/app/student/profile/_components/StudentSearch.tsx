'use client';

import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { searchStudents, getStudentDetails, getResumeUrl } from '@/lib/actions/students';
import { toast } from 'sonner';
import { Mail, Loader2, GraduationCap, Download, CalendarIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ProjectCard } from './SavedProjects';
import { Carousel } from '@/components/ui/apple-cards-carousel';

type Student = {
  id: string;
  name: string | null;
  email: string;
};

type StudentProject = {
  id: string;
  title: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  company_name: string | null;
  company_logo_url?: string | null;
};

type StudentDetails = {
  id: string;
  name: string | null;
  email: string;
  description: string | null;
  grad_date: string | null;
  interests: string[] | null;
  resume_url: string | null;
  school_name: string | null;
  projects?: StudentProject[];
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

function StudentModal({ student }: { student: Student }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !details) {
      setIsLoading(true);
      try {
        const result = await getStudentDetails(student.id);
        setIsLoading(false);
        if (result.success && result.student) {
          setDetails(result.student as StudentDetails);
        } else {
          toast.error(result.error || 'Failed to load student details');
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error loading student details:', error);
        toast.error('An error occurred while loading student details');
      }
    }
  };
  
  const handleDownloadResume = async () => {
    if (!details?.resume_url) return;
    
    try {
      const result = await getResumeUrl(student.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to get resume URL');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <BentoGridItem
            title={student.name || student.email}
            description={student.email}
            header={
              <Avatar className="h-12 w-12">
                <AvatarFallback>
                  {getInitials(student.name, student.email)}
                </AvatarFallback>
              </Avatar>
            }
            className="hover:shadow-lg transition-shadow p-3"
            data-testid={`student-result-${student.id}`}
          />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Student Profile</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : details ? (
            <div className="space-y-4">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 rounded-lg">
                <AvatarFallback className="rounded-lg text-2xl">
                  {getInitials(details.name, details.email)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-3xl font-semibold">{details.name || 'Student'}</h3>
                  {details.school_name && (
                    <Badge variant="outline" className="bg-muted/50">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {details.school_name}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{details.email}</span>
                  </div>
                  {details.grad_date && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Graduating {format(new Date(details.grad_date), 'MMMM yyyy')}</span>
                    </div>
                  )}
                </div>
                
                {details.interests && details.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {details.interests.map((interest, idx) => (
                      <Badge key={idx} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
                
              </div>
            </div>
            
            {details.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-4">About</h2>
                  <p className="text-sm text-muted-foreground">{details.description}</p>
                  {details.resume_url && (
                    <div className="mt-3">
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadResume();
                        }}
                        className="text-sm text-primary hover:underline flex items-center gap-1.5"
                      >
                        <Download className="h-4 w-4" />
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {details.projects && details.projects.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Projects</h2>
                  <Carousel
                    items={details.projects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onClick={() => {
                          setIsOpen(false);
                          router.push(`/student/projects/${project.id}`);
                        }}
                        className="w-80 flex-shrink-0"
                      />
                    ))}
                  />
                </div>
              </>
            )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Failed to load profile details</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StudentSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Load all students initially
  useEffect(() => {
    const loadStudents = async () => {
      setIsSearching(true);
      const result = await searchStudents('');
      setIsSearching(false);
      setHasSearched(true);
      if (result.success) {
        setStudents(result.students as Student[]);
      }
    };
    loadStudents();
  }, []);
  
  // Search students when query changes (debounced)
  useEffect(() => {
    if (!hasSearched) return;
    
    const timer = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchStudents(searchQuery);
      setIsSearching(false);
      if (result.success) {
        setStudents(result.students as Student[]);
      } else {
        toast.error(result.error || 'Failed to search students');
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, hasSearched]);
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Student Directory</h2>
      <Input
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md mb-6"
        data-testid="student-search-input"
      />
      
      {isSearching ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : students.length === 0 ? (
        <p className="text-sm text-muted-foreground">No students found.</p>
      ) : (
        <BentoGrid className="md:auto-rows-auto gap-3">
          {students.map((student) => (
            <StudentModal key={student.id} student={student} />
          ))}
        </BentoGrid>
      )}
    </div>
  );
}

