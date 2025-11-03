interface ProjectPageProps {
  params: { id: string }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Project {params.id}</h1>
      <p className="text-sm text-muted-foreground mt-2">Tabs (Edit, Applicants) coming next.</p>
    </div>
  )
}


