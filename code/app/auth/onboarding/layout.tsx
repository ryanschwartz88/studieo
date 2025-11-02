import { requireEmailVerified, getOnboardingStatus } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  await requireEmailVerified();
  
  // If onboarding is already complete, redirect to browse
  const { complete } = await getOnboardingStatus();
  if (complete) {
    redirect('/browse');
  }
  
  return <>{children}</>;
}


