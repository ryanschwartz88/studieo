import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StudentHeader } from './_components/StudentHeader';
import { SavedProjects } from './_components/SavedProjects';
import { StudentSearch } from './_components/StudentSearch';
import { Separator } from '@/components/ui/separator';
import { getSavedProjectsWithDetails } from '@/lib/actions/saved-projects';

export default async function StudentProfilePage() {
  const supabase = await createClient();
  
  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Verify user has STUDENT role
  const { data: userData } = await supabase
    .from('users')
    .select('role, id, name, email')
    .eq('id', user.id)
    .single();
  
  if (!userData || userData.role !== 'STUDENT') {
    redirect('/');
  }
  
  // Fetch student profile
  const { data: profile } = await supabase
    .from('student_profiles')
    .select('user_id, description, grad_date, interests, resume_url, updated_at')
    .eq('user_id', user.id)
    .single();
  
  if (!profile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Error</h1>
        <p className="text-sm text-muted-foreground mt-2">Profile not found.</p>
      </div>
    );
  }
  
  // Fetch school name from email domain
  let schoolName = null;
  if (user.email) {
    const emailDomain = user.email.split('@')[1];
    const { data: schoolData } = await supabase
      .from('allowed_school_domains')
      .select('school_name')
      .eq('domain', emailDomain)
      .eq('active', true)
      .single();
    
    if (schoolData?.school_name) {
      schoolName = schoolData.school_name;
    }
  }
  
  // Fetch saved projects with details
  const savedProjectsResult = await getSavedProjectsWithDetails();
  const savedProjects = savedProjectsResult.success ? savedProjectsResult.projects : [];
  
  return (
    <div className="w-full p-6 max-w-6xl mx-auto">
      <StudentHeader 
        user={{
          id: userData.id,
          name: userData.name,
          email: userData.email,
        }}
        profile={profile}
        schoolName={schoolName}
      />
      <Separator className="my-6" />
      <SavedProjects projects={savedProjects} />
      <Separator className="my-6" />
      <StudentSearch />
    </div>
  );
}