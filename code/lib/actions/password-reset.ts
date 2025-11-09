'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Exchange password reset code for a session
 * Must be called as a server action (not from page component) to ensure cookies work properly
 */
export async function exchangePasswordResetCode(code: string) {
  const supabase = await createClient();
  
  console.log('[EXCHANGE-CODE] Starting exchange...');
  
  const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  
  console.log('[EXCHANGE-CODE] Result:', {
    hasSession: !!exchangeData?.session,
    hasUser: !!exchangeData?.user,
    error: exchangeError?.message,
  });
  
  if (exchangeError) {
    return { 
      success: false, 
      error: exchangeError.message || 'Invalid or expired reset link' 
    };
  }
  
  if (!exchangeData?.session) {
    return { 
      success: false, 
      error: 'Failed to create session' 
    };
  }
  
  // Verify session is actually available
  const { data: { session } } = await supabase.auth.getSession();
  console.log('[EXCHANGE-CODE] Session verification:', { hasSession: !!session });
  
  return { 
    success: true,
    hasSession: !!session,
  };
}

