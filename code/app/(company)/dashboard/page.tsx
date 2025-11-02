import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOut } from '@/lib/actions/auth';

export default async function CompanyDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: userData } = await supabase
    .from('users')
    .select('name, company:companies(name, vetted)')
    .eq('id', user?.id)
    .single();

  const company = userData?.company as any;
  const isVetted = company?.vetted;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {company?.name || 'Company Dashboard'} 🚀
              </h1>
              {isVetted ? (
                <Badge className="bg-green-600">Vetted</Badge>
              ) : (
                <Badge variant="secondary">Pending Review</Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Welcome, {userData?.name}! Manage your projects and find elite student teams.
            </p>
          </div>
          <form action={signOut}>
            <Button variant="outline" type="submit">
              Sign Out
            </Button>
          </form>
        </div>

        {!isVetted && (
          <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800">⏳ Account Under Review</CardTitle>
              <CardDescription className="text-yellow-700">
                Our team is reviewing your company profile. You'll be able to post projects once approved.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-blue-600">Post Project</CardTitle>
              <CardDescription>
                Create a new project and find talented students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                disabled={!isVetted}
              >
                {isVetted ? 'Coming Soon' : 'Awaiting Approval'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader>
              <CardTitle className="text-purple-600">My Projects</CardTitle>
              <CardDescription>
                View and manage your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-white">
            <CardHeader>
              <CardTitle className="text-pink-600">Applications</CardTitle>
              <CardDescription>
                Review student team applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-pink-600 hover:bg-pink-700" 
                disabled
              >
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none">
          <CardHeader>
            <CardTitle>🎊 Authentication Complete!</CardTitle>
            <CardDescription className="text-blue-100">
              Your company account has been created successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="mb-4">What happens next:</p>
            <ul className="list-disc list-inside space-y-2 text-blue-100">
              <li>✅ Account created and linked to your company domain</li>
              <li>⏳ Studieo admin team will review your company profile</li>
              <li>📧 You'll receive an email once approved</li>
              <li>🚀 Then you can start posting projects and hiring elite teams</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

