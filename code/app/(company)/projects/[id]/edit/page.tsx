import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProjectForm from './EditProjectForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectEditPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()
  if (!userData || userData.role !== 'COMPANY') redirect('/')
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !project) redirect('/projects/' + id)

  if (project.company_id && userData.company_id && project.company_id !== userData.company_id) {
    redirect('/projects/' + id)
  }

  // If project is archived, redirect to dashboard
  if (project.status === 'ARCHIVED') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Edit Project</h1>
      <EditProjectForm project={project} />
    </div>
  )
}


