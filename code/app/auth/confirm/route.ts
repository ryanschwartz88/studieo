import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code"); // PKCE flow

  console.log('[CONFIRM] Starting verification process', { 
    token_hash: !!token_hash, 
    type, 
    code: !!code 
  });

  const supabase = await createClient();

  // Handle PKCE flow (code parameter)
  if (code) {
    console.log('[CONFIRM] Using PKCE flow with code');
    
    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    console.log('[CONFIRM] Code exchange result:', {
      success: !exchangeError,
      error: exchangeError?.message,
      hasSession: !!exchangeData?.session
    });

    if (exchangeError) {
      console.log('[CONFIRM] Code exchange failed:', exchangeError.message);
      redirect(`/auth/error?error=${encodeURIComponent(exchangeError?.message || 'Verification failed')}`);
    }

    if (!exchangeData?.session) {
      console.log('[CONFIRM] No session after code exchange');
      redirect('/auth/login');
    }

    const user = exchangeData.session.user;
    console.log('[CONFIRM] User from code exchange:', { id: user.id, email: user.email });

    // Get user role and redirect
    await handleUserRedirect(supabase, user);
  }
  // Handle legacy token_hash flow
  else if (token_hash && type) {
    console.log('[CONFIRM] Using legacy token_hash flow');
    
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    
    console.log('[CONFIRM] Verify result:', { 
      success: !verifyError, 
      error: verifyError?.message,
      hasSession: !!verifyData?.session 
    });
    
    if (verifyError || !verifyData?.session) {
      console.log('[CONFIRM] Verification failed:', verifyError?.message);
      redirect(`/auth/error?error=${encodeURIComponent(verifyError?.message || 'Verification failed')}`);
    }

    const user = verifyData.session.user;
    console.log('[CONFIRM] User from session:', { id: user.id, email: user.email });

    // Get user role and redirect
    await handleUserRedirect(supabase, user);
  }
  // No valid parameters
  else {
    console.log('[CONFIRM] Missing code or token_hash/type');
    redirect(`/auth/error?error=No%20verification%20code%20found`);
  }
}

// Helper function to handle role-based redirects
async function handleUserRedirect(supabase: any, user: any) {
  if (!user) {
    console.log('[CONFIRM] No user provided');
    redirect('/auth/login');
  }

  // Get user role from the users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  console.log('[CONFIRM] User data:', { role: userData?.role, error: userError?.message });
  
  const userRole = userData?.role;
  
  if (userRole === 'STUDENT') {
    // Check if student profile is complete
    const { data: studentProfile, error: profileError } = await supabase
      .from('student_profiles')
      .select('grad_date')
      .eq('user_id', user.id)
      .single();
    
    console.log('[CONFIRM] Student profile:', { 
      hasGradDate: !!studentProfile?.grad_date, 
      error: profileError?.message 
    });
    
    // If profile is incomplete, go to onboarding
    if (!studentProfile?.grad_date) {
      console.log('[CONFIRM] Redirecting to onboarding');
      redirect('/auth/onboarding');
    }
    
    // Profile complete, go to student browse
    console.log('[CONFIRM] Redirecting to student browse');
    redirect('/student/browse');
  } else if (userRole === 'COMPANY') {
    // Companies don't need onboarding, go straight to dashboard
    console.log('[CONFIRM] Redirecting to company dashboard');
    redirect('/company/dashboard');
  }
  
  // Fallback to login if role is unknown
  console.log('[CONFIRM] Unknown role, redirecting to login');
  redirect('/auth/login');
}
