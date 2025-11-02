'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resetPassword } from '@/lib/actions/auth';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const result = await resetPassword(email);
      
      if (!result.success) {
        setError(result.error || 'Failed to send reset email');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="mx-auto w-full max-w-md space-y-8 text-center animate-in fade-in-50">
          <div className="flex justify-center mb-8">
            <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
          </div>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We've sent you a password reset link. Check your inbox and follow the instructions.
          </p>
          <Link href="/auth/login" className="inline-block">
            <Button variant="outline" className="h-11 rounded-xl">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-8 animate-in fade-in-50">
        <div className="flex justify-center mb-8">
          <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
        </div>
        
        <h1 className="text-3xl font-semibold text-center tracking-tight mb-8">Reset your password</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@example.com" 
                required 
                disabled={loading} 
                className="pl-10 h-11 rounded-xl" 
                data-testid="reset-email" 
                value={email} 
                onChange={(e)=>setEmail(e.target.value)} 
              />
            </div>
          </div>
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
              {error}
            </div>
          )}
          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50" 
            disabled={loading || !email} 
            data-testid="reset-submit"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </form>
        
        <p className="text-sm text-muted-foreground text-center">
          <Link href="/auth/login" className="hover:underline font-medium">
            <ArrowLeft className="inline mr-1 h-4 w-4" /> 
            Return to Sign In
          </Link>
        </p>
        
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t have an account?{' '}
          <Link href="/auth/sign-up" className="hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
