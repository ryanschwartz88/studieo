'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { exchangePasswordResetCode } from '@/lib/actions/password-reset';
import { UpdatePasswordForm } from './UpdatePasswordForm';
import { Loader2 } from 'lucide-react';

export function UpdatePasswordClient() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [loading, setLoading] = useState(!!code);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(!code); // If no code, we're ready immediately

  useEffect(() => {
    async function handleCodeExchange() {
      if (!code) return;

      console.log('[CLIENT] Exchanging code...');
      setLoading(true);
      
      try {
        const result = await exchangePasswordResetCode(code);
        
        console.log('[CLIENT] Exchange result:', result);
        
        if (!result.success) {
          setError(result.error || 'Failed to verify reset link');
          setLoading(false);
          return;
        }

        // Success - code exchanged and session established
        setReady(true);
        setLoading(false);
        
        // Optional: Clean up URL by removing code parameter
        window.history.replaceState({}, '', '/auth/update-password');
      } catch (err) {
        console.error('[CLIENT] Exchange error:', err);
        setError('An unexpected error occurred');
        setLoading(false);
      }
    }

    handleCodeExchange();
  }, [code]);

  if (loading) {
    return (
      <div className="space-y-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Verifying reset link...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
        <a 
          href="/auth/forgot-password" 
          className="text-sm text-muted-foreground hover:underline"
        >
          Request a new reset link
        </a>
      </div>
    );
  }

  if (!ready) {
    return null;
  }

  return <UpdatePasswordForm />;
}

