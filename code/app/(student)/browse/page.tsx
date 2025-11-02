import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';

export default async function BrowsePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: userData } = await supabase
    .from('users')
    .select('name')
    .eq('id', user?.id)
    .single();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome, {userData?.name}! 🎉
            </h1>
            <p className="text-muted-foreground mt-2">
              Your student dashboard is ready. Browse projects and start building.
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-blue-600">Browse Projects</CardTitle>
              <CardDescription>
                Discover exciting opportunities from top companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-purple-600">My Applications</CardTitle>
              <CardDescription>
                Track your project applications and teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white">
            <CardHeader>
              <CardTitle className="text-pink-600">My Profile</CardTitle>
              <CardDescription>
                Update your profile and manage your resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-pink-600 hover:bg-pink-700" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader>
            <CardTitle>🎊 Authentication Complete!</CardTitle>
            <CardDescription className="text-blue-100">
              You've successfully completed the entire authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-4">What we've built:</p>
            <ul className="list-disc list-inside space-y-2 text-blue-100">
              <li>✅ Student & Company sign-up with domain validation</li>
              <li>✅ Email verification and secure authentication</li>
              <li>✅ Multi-step student onboarding with profile completion</li>
              <li>✅ Role-based access control and protected routes</li>
              <li>✅ Password reset and update flows</li>
              <li>✅ Beautiful, modern UI with gradient designs</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

