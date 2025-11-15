'use client'

import { useState, useTransition } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { projectInlineUpdateSchema } from '@/lib/schemas/projects'
import { updateProjectFields } from '@/lib/actions/projects'

type EditableProject = {
  id: string
  title: string | null
  short_summary: string | null
  detailed_description: string | null
  deliverables: string | null
  resource_links: string | null
}

interface InlineProjectEditorProps {
  project: EditableProject
  onSaved?: () => void
  onCancel?: () => void
}

export function InlineProjectEditor({ project, onSaved, onCancel }: InlineProjectEditorProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof projectInlineUpdateSchema>>({
    resolver: zodResolver(projectInlineUpdateSchema),
    defaultValues: {
      title: project.title ?? '',
      short_summary: project.short_summary ?? '',
      detailed_description: project.detailed_description ?? '',
      deliverables: project.deliverables ?? '',
      resource_links: project.resource_links ?? '',
    },
  })

  async function onSubmit(values: z.infer<typeof projectInlineUpdateSchema>) {
    setError(null)
    startTransition(async () => {
      const result = await updateProjectFields(project.id, values)
      if ((result as any)?.error) {
        setError((result as any).error)
        return
      }
      onSaved?.()
    })
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input data-testid="project-title" className="h-11" placeholder="Project title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="short_summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Summary</FormLabel>
                <FormControl>
                  <Input data-testid="project-summary" className="h-11" placeholder="Short summary" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="detailed_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Detailed Description</FormLabel>
                <FormControl>
                  <Textarea data-testid="project-description" className="min-h-[140px]" placeholder="Describe the project in detail" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deliverables"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deliverables</FormLabel>
                <FormControl>
                  <Textarea data-testid="project-deliverables" className="min-h-[100px]" placeholder="What should students deliver?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resource_links"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Links</FormLabel>
                <FormControl>
                  <Textarea data-testid="project-resource-links" className="min-h-[80px]" placeholder="Links separated by space or newlines" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button data-testid="cancel-edit-form" type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button data-testid="save-project" type="submit" disabled={isPending}>
              {isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}


