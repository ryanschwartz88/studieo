import { getAuthenticatedRedirect } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If user is already authenticated, redirect to appropriate dashboard
  const redirectPath = await getAuthenticatedRedirect();
  
  if (redirectPath) {
    redirect(redirectPath);
  }
  
  // Show auth UI with subtle animated background and centered container
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* animated gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -inset-40 rounded-[100%] bg-[radial-gradient(circle_at_center,theme(colors.primary/10),transparent_60%)] animate-pulse" />
        <div className="absolute right-[-30%] top-[-30%] h-[60vh] w-[60vh] rounded-full bg-[radial-gradient(circle_at_center,theme(colors.blue.300/15),transparent_60%)] blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-4 py-16">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}

