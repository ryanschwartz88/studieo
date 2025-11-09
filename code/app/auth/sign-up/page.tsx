'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsContents, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs';
import { signUpStudent, signUpCompany } from '@/lib/actions/auth';
import { Loader2, X, Eye, EyeOff, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Image from 'next/image';

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'student' | 'company'>('student');
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [companyUserName, setCompanyUserName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPassword, setCompanyPassword] = useState('');
  
  // Password visibility
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [showCompanyPassword, setShowCompanyPassword] = useState(false);
  
  // Password focus tracking (to show checklist after first focus)
  const [studentPasswordFocused, setStudentPasswordFocused] = useState(false);
  const [companyPasswordFocused, setCompanyPasswordFocused] = useState(false);
  
  // Student password validation
  const studentHasMinLength = studentPassword.length >= 8;
  const studentHasNumber = /[0-9]/.test(studentPassword);
  const studentHasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(studentPassword);
  const studentPasswordValid = studentHasMinLength && studentHasNumber && studentHasSpecialChar;
  
  // Company password validation
  const companyHasMinLength = companyPassword.length >= 8;
  const companyHasNumber = /[0-9]/.test(companyPassword);
  const companyHasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(companyPassword);
  const companyPasswordValid = companyHasMinLength && companyHasNumber && companyHasSpecialChar;

  // Student form
  async function handleStudentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStudentError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signUpStudent({ name, email, password });
      
      if (!result.success) {
        setStudentError(result.error || 'Failed to sign up');
      }
      // On success, signUpStudent redirects automatically
    } catch (err: any) {
      // Check if this is a Next.js redirect (which is expected on success)
      // Next.js redirect throws an error with NEXT_REDIRECT in the digest
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err; // Re-throw to allow the redirect to happen
      }
      setStudentError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  // Company form
  async function handleCompanySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setCompanyError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const company_name = formData.get('company_name') as string;
    const role = formData.get('role') as string;

    try {
      const result = await signUpCompany({ email, password, name, company_name, role });
      
      if (!result.success) {
        setCompanyError(result.error || 'Failed to sign up');
      }
      // On success, signUpCompany redirects automatically
    } catch (err: any) {
      // Check if this is a Next.js redirect (which is expected on success)
      // Next.js redirect throws an error with NEXT_REDIRECT in the digest
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err; // Re-throw to allow the redirect to happen
      }
      setCompanyError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md space-y-8 animate-in fade-in-50">
        <div className="flex justify-center mb-8">
          <Image src="/Studieo Logo/Full Logo.svg" alt="Studieo" width={160} height={32} priority />
        </div>
        <h1 className="text-center text-3xl font-semibold tracking-tight mb-8">Create an account</h1>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'student' | 'company')} className="w-full">
          <div className="mb-6 flex justify-center">
            <TabsList className="inline-flex bg-muted p-1 rounded-xl">
              <TabsTrigger value="student" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                Student
              </TabsTrigger>
              <TabsTrigger value="company" className="rounded-lg px-6 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                Company
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContents>
            {/* Student Sign Up */}
            <TabsContent value="student" className="space-y-4 mt-0 px-1">
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Full Name</Label>
                <Input
                  id="student-name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  required
                  disabled={loading}
                  data-testid="student-name"
                  className="h-11 rounded-xl"
                  value={studentName}
                  onChange={(e)=>setStudentName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-email">University Email</Label>
                <Input
                  id="student-email"
                  name="email"
                  type="email"
                  placeholder="name@stanford.edu"
                  required
                  disabled={loading}
                  data-testid="student-email"
                  className="h-11 rounded-xl"
                  value={studentEmail}
                  onChange={(e)=>setStudentEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Must use your .edu email address
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="student-password">Password</Label>
                <div className="relative">
                  <Input
                    id="student-password"
                    name="password"
                    type={showStudentPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    data-testid="student-password"
                    className="h-11 rounded-xl pr-10"
                    value={studentPassword}
                    onChange={(e)=>setStudentPassword(e.target.value)}
                    onFocus={() => setStudentPasswordFocused(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showStudentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {studentPasswordFocused && (
                  <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-sm">
                      {studentHasMinLength ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={studentHasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                        Minimum 8 letters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {studentHasNumber ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={studentHasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {studentHasSpecialChar ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={studentHasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {studentError && (
                <Alert variant="destructive">
                  <AlertTitle>There was a problem</AlertTitle>
                  <AlertDescription>
                    {studentError}
                    {studentError.includes('already exists') && (
                      <>
                        {' '}
                        <Link href="/auth/login" className="underline font-medium hover:text-destructive-foreground">
                          Go to login
                        </Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50"
                disabled={loading || !studentName || !studentEmail || !studentPasswordValid}
                data-testid="student-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>Create Student Account</>
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Company Sign Up */}
          <TabsContent value="company" className="space-y-4 mt-0 px-1">
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-user-name">Your Full Name</Label>
                <Input
                  id="company-user-name"
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  required
                  disabled={loading}
                  data-testid="company-user-name"
                  className="h-11 rounded-xl"
                  value={companyUserName}
                  onChange={(e)=>setCompanyUserName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  name="company_name"
                  type="text"
                  placeholder="Google"
                  required
                  disabled={loading}
                  data-testid="company-name"
                  className="h-11 rounded-xl"
                  value={companyName}
                  onChange={(e)=>setCompanyName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-role">Your Role at Company</Label>
                <Input
                  id="company-role"
                  name="role"
                  type="text"
                  placeholder="Engineering Manager"
                  required
                  disabled={loading}
                  data-testid="company-role"
                  className="h-11 rounded-xl"
                  value={companyRole}
                  onChange={(e)=>setCompanyRole(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-email">Work Email</Label>
                <Input
                  id="company-email"
                  name="email"
                  type="email"
                  placeholder="name@company.com"
                  required
                  disabled={loading}
                  data-testid="company-email"
                  className="h-11 rounded-xl"
                  value={companyEmail}
                  onChange={(e)=>setCompanyEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Use your company email, not a personal email
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-password">Password</Label>
                <div className="relative">
                  <Input
                    id="company-password"
                    name="password"
                    type={showCompanyPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    data-testid="company-password"
                    className="h-11 rounded-xl pr-10"
                    value={companyPassword}
                    onChange={(e)=>setCompanyPassword(e.target.value)}
                    onFocus={() => setCompanyPasswordFocused(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCompanyPassword(!showCompanyPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCompanyPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {companyPasswordFocused && (
                  <div className="space-y-2 animate-in fade-in-50 slide-in-from-top-1">
                    <div className="flex items-center gap-2 text-sm">
                      {companyHasMinLength ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={companyHasMinLength ? 'text-green-600' : 'text-muted-foreground'}>
                        Minimum 8 letters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {companyHasNumber ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={companyHasNumber ? 'text-green-600' : 'text-muted-foreground'}>
                        At least one number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {companyHasSpecialChar ? (
                        <Check className="h-3 w-3 text-green-600 transition-all duration-300" />
                      ) : (
                        <X className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className={companyHasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}>
                        At least one special character
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {companyError && (
                <Alert variant="destructive">
                  <AlertTitle>There was a problem</AlertTitle>
                  <AlertDescription>
                    {companyError}
                    {companyError.includes('already exists') && (
                      <>
                        {' '}
                        <Link href="/auth/login" className="underline font-medium hover:text-destructive-foreground">
                          Go to login
                        </Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 disabled:opacity-50"
                disabled={loading || !companyUserName || !companyName || !companyRole || !companyEmail || !companyPasswordValid}
                data-testid="company-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>Create Company Account</>
                )}
              </Button>
            </form>
          </TabsContent>
          </TabsContents>
        </Tabs>
        
        <p className="text-sm text-muted-foreground text-center w-full">
          Already have an account?{' '}
          <Link href="/auth/login" className="hover:underline font-medium">
            Sign in
          </Link>
        </p>
        
        <p className="text-xs text-center text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="https://www.studieo.com" className="underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="https://www.studieo.com" className="underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
