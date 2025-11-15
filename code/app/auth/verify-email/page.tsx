'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resendVerificationEmail } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Get initial user data
    (async () => {
      // First try to get email from URL parameter (passed during signup)
      const emailFromUrl = searchParams.get('email');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Use URL email as fallback if session email is not available
      setEmail(user?.email ?? emailFromUrl ?? null);
      
      console.log('[VERIFY] Initial user check:', { 
        hasUser: !!user, 
        email: user?.email,
        confirmed: !!user?.email_confirmed_at 
      });
      
      // If email is already confirmed, redirect based on role
      if (user?.email_confirmed_at) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('[VERIFY] User already confirmed, role:', userData?.role);
        
        if (userData?.role === 'STUDENT') {
          router.replace('/auth/onboarding');
        } else if (userData?.role === 'COMPANY') {
          router.replace('/dashboard');
        }
      }
    })();
    
    // Poll for email confirmation
    const interval = setInterval(async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log('[VERIFY] Polling check:', { 
        hasUser: !!user, 
        confirmed: !!user?.email_confirmed_at,
        error: error?.message 
      });
      
      if (user?.email_confirmed_at) {
        console.log('[VERIFY] Email confirmed! Getting user role...');
        
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        console.log('[VERIFY] Redirecting based on role:', userData?.role);
        
        if (userData?.role === 'STUDENT') {
          // Check if profile is complete
          const { data: studentProfile } = await supabase
            .from('student_profiles')
            .select('grad_date')
            .eq('user_id', user.id)
            .single();
          
          if (!studentProfile?.grad_date) {
            router.replace('/auth/onboarding');
          } else {
            router.replace('/student/search');
          }
        } else if (userData?.role === 'COMPANY') {
          router.replace('/company/dashboard');
        }
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(interval);
  }, [router, searchParams]);

  async function handleResend() {
    setSending(true);
    // Fetch latest email on demand to avoid disabled states
    let currentEmail = email || undefined;
    if (!currentEmail) {
      const emailFromUrl = searchParams.get('email');
      const { data: { user } } = await createClient().auth.getUser();
      currentEmail = user?.email ?? emailFromUrl ?? undefined;
    }
    const res = currentEmail ? await resendVerificationEmail(currentEmail) : { success: false, error: 'No email on session' };
    setStatus(res.success ? 'Verification email sent.' : res.error || 'Failed to send email.');
    setSending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-8 text-center animate-in fade-in-50">
        <div className="flex justify-center mb-8">
          <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <span className="font-medium text-foreground">{email ?? 'your email address'}</span>.
          </p>
          <p className="text-sm text-muted-foreground">
            Click the link in the email to complete your registration and continue.
          </p>
        </div>
        
        {status && (
          <Alert>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <Button 
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50" 
            onClick={handleResend} 
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Wrong address?{' '}
          <a href="/auth/login" className="underline font-medium hover:text-foreground">
            Sign in with a different email
          </a>
        </p>
      </div>
    </div>
  );
}


