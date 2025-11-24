import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, check their role and redirect
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userData?.role === 'STUDENT') {
      // Check if student profile is complete
      const { data: studentProfile } = await supabase
        .from('student_profiles')
        .select('grad_date')
        .eq('user_id', user.id)
        .single();
      
      // If profile incomplete, send to onboarding
      if (!studentProfile?.grad_date) {
        redirect('/auth/onboarding');
      }
      
      redirect('/student/search');
    } else if (userData?.role === 'COMPANY') {
      redirect('/company/dashboard');
    }
  }

  // For non-authenticated users, redirect to Framer
  redirect('/');
}
