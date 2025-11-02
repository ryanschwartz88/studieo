import { getAuthenticatedRedirect } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export default async function LoginLayout({ children }: { children: React.ReactNode }) {
  // If user is already authenticated, redirect them to their dashboard
  const redirectPath = await getAuthenticatedRedirect();
  
  if (redirectPath) {
    redirect(redirectPath);
  }
  
  return <>{children}</>;
}

