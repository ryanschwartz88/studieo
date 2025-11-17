'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { updateStudentProfile, uploadResume, getResumeUrl } from '@/lib/actions/students';
import { toast } from 'sonner';
import { Pencil, Loader2, Download, CalendarIcon, GraduationCap, Mail } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

type StudentProfile = {
  user_id: string;
  description: string | null;
  grad_date: string | null;
  interests: string[] | null;
  resume_url: string | null;
};

type User = {
  id: string;
  name: string | null;
  email: string;
};

interface StudentHeaderProps {
  user: User;
  profile: StudentProfile;
  schoolName: string | null;
}

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

export function StudentHeader({ user, profile, schoolName }: StudentHeaderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [gradDate, setGradDate] = useState<Date | undefined>(
    profile.grad_date ? new Date(profile.grad_date) : undefined
  );
  
  const form = useForm({
    defaultValues: {
      description: profile.description || '',
      grad_date: profile.grad_date || '',
      interests: profile.interests?.join(', ') || '',
    },
  });
  
  const currentYear = new Date().getFullYear();
  
  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };
  
  const handleDownloadResume = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    try {
      const result = await getResumeUrl(user.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to get resume URL');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };
  
  const onSubmit = async (data: any) => {
    try {
      setIsUploading(true);
      
      // Upload resume if changed
      if (resumeFile) {
        const resumeResult = await uploadResume(resumeFile);
        if (!resumeResult.success) {
          toast.error(resumeResult.error || 'Failed to upload resume');
          setIsUploading(false);
          return;
        }
      }
      
      // Parse interests from comma-separated string
      const interests = data.interests
        .split(',')
        .map((i: string) => i.trim())
        .filter((i: string) => i.length > 0);
      
      // Update profile
      const result = await updateStudentProfile({
        description: data.description,
        grad_date: gradDate,
        interests,
      });
      
      if (!result.success) {
        toast.error(result.error || 'Failed to update profile');
        setIsUploading(false);
        return;
      }
      
      toast.success('Profile updated successfully');
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      toast.error('An error occurred');
      setIsUploading(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-6">
        <div className="relative">
          <Avatar className="w-24 h-24 rounded-lg">
            <AvatarFallback className="rounded-lg text-2xl">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold">{user.name || 'Student'}</h1>
            {schoolName && (
              <Badge variant="outline" className="bg-muted/50">
                <GraduationCap className="h-3 w-3 mr-1" />
                {schoolName}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            {profile.grad_date && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4" />
                <span>Graduating {format(new Date(profile.grad_date), 'MMMM yyyy')}</span>
              </div>
            )}
          </div>
          
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.interests.map((interest, idx) => (
                <Badge key={idx} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
          
          
        </div>
        
        <Button variant="outline" onClick={() => setIsOpen(true)} data-testid="edit-profile-button">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>
      
      {profile.description && (
        <>
          <Separator className="my-4" />
          <div>
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-sm text-muted-foreground">{profile.description}</p>
          </div>
          {profile.resume_url && (
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
        </>
      )}
      
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          // Reset gradDate when dialog closes
          setGradDate(profile.grad_date ? new Date(profile.grad_date) : undefined);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">About Me</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                rows={4}
                placeholder="Tell us about yourself..."
                data-testid="student-description-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="grad_date">Graduation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="grad_date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-11',
                      !gradDate && 'text-muted-foreground'
                    )}
                    data-testid="student-grad-date-input"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {gradDate ? format(gradDate, 'PPP') : 'Select graduation date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown"
                    selected={gradDate}
                    onSelect={setGradDate}
                    defaultMonth={gradDate ?? new Date()}
                    startMonth={new Date(currentYear, 0, 1)}
                    endMonth={new Date(currentYear + 4, 11, 31)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Input
                id="interests"
                {...form.register('interests')}
                placeholder="Software Engineering, AI/ML, Product Design"
                data-testid="student-interests-input"
              />
              <p className="text-xs text-muted-foreground">
                Separate interests with commas
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Resume</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeChange}
                  data-testid="student-resume-upload"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                PDF or Word document. Max 5MB.
              </p>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

