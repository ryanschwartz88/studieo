import { getAuthenticatedRedirect } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export default async function AuthCallback() {
  // After Supabase email link / OAuth, decide where to go
  const dest = await getAuthenticatedRedirect();
  redirect(dest ?? '/');
}


