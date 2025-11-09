'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { updatePassword } from '@/lib/actions/auth';
import { Lock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function UpdatePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const isValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && passwordsMatch;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!isValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await updatePassword(password);
      
      if (!result.success) {
        setError(result.error || 'Failed to update password');
        setLoading(false);
      }
      // On success, updatePassword redirects automatically (don't set loading to false)
    } catch (err) {
      // Check if this is a Next.js redirect (which is expected)
      if (err && typeof err === 'object' && 'digest' in err && typeof (err as any).digest === 'string') {
        // This is a Next.js redirect, let it propagate
        throw err;
      }
      // Otherwise it's a real error
      setError('An unexpected error occurred');
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Create New Password</h1>
        <p className="text-sm text-muted-foreground">
          Enter a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-10 h-11 rounded-xl"
              data-testid="new-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className="pl-10 h-11 rounded-xl"
              data-testid="confirm-password"
            />
          </div>
        </div>

        {/* Password requirements */}
        <div className="rounded-xl border bg-muted/50 p-4 space-y-2">
          <p className="text-sm font-medium mb-2">Password Requirements:</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              {hasMinLength ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={hasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasUpperCase ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}>
                One uppercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasLowerCase ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}>
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {hasNumber ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={hasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                One number
              </span>
            </div>
            <div className="flex items-center gap-2">
              {passwordsMatch ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={passwordsMatch ? 'text-green-600' : 'text-muted-foreground'}>
                Passwords match
              </span>
            </div>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50"
          disabled={loading || !isValid}
          data-testid="update-password-submit"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            'Update Password'
          )}
        </Button>
      </form>
    </>
  );
}

