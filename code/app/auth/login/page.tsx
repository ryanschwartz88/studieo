'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { signIn, signInWithGoogle } from '@/lib/actions/auth';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signIn({ email, password });
    if (!result.success) setError(result.error || 'Failed to sign in');
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-8 animate-in fade-in-50">
        <div className="flex justify-center mb-8">
          <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
        </div>

        <h1 className="text-center text-3xl font-semibold tracking-tight mb-8">Welcome back</h1>

        <div className="mb-6 space-y-4">
          <form action={async () => { await signInWithGoogle(); }}>
            <Button type="submit" variant="outline" className="w-full h-11 rounded-xl border-input hover:bg-accent hover:text-accent-foreground" data-testid="login-google">
              <FcGoogle className="mr-2 h-5 w-5" />
              Continue with Google
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              disabled={loading} 
              data-testid="login-email" 
              className="h-11 rounded-xl" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-muted-foreground hover:underline">
                Forgot your password?
              </Link>
            </div>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              autoComplete="current-password" 
              required 
              disabled={loading} 
              data-testid="login-password" 
              className="h-11 rounded-xl" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button 
            type="submit" 
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50" 
            disabled={loading || !email || !password} 
            data-testid="login-submit"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

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
