'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getProjectResourceSignedUrl } from '@/lib/actions/projects'

function getFileName(path: string): string {
  const clean = path.replace(/^project_resources\//, '')
  const parts = clean.split('/')
  return parts[parts.length - 1] || clean
}

function getFileKind(path: string): 'image' | 'pdf' | 'other' {
  const name = path.toLowerCase()
  if (/(\.png|\.jpe?g|\.gif|\.webp)$/.test(name)) return 'image'
  if (/\.pdf$/.test(name)) return 'pdf'
  return 'other'
}

interface ResourceFilesProps {
  files: string[]
  projectId: string
}

export function ResourceFiles({ files, projectId }: ResourceFilesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewName, setPreviewName] = useState<string>('')
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | 'other'>('other')
  const [isPending, startTransition] = useTransition()
  const hasFiles = files && files.length > 0

  function handlePreview(path: string) {
    const fileName = getFileName(path)
    const kind = getFileKind(path)
    setPreviewKind(kind)
    setPreviewName(fileName)
    startTransition(async () => {
      const res = await getProjectResourceSignedUrl(projectId, path)
      if ((res as any)?.url) {
        setPreviewUrl((res as any).url as string)
        setIsOpen(true)
      }
    })
  }

  function handleDownload(path: string) {
    const fileName = getFileName(path)
    startTransition(async () => {
      const res = await getProjectResourceSignedUrl(projectId, path, { downloadName: fileName })
      const url = (res as any)?.url as string | undefined
      if (url) {
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    })
  }

  return (
    <div className="space-y-3 text-sm">
      {!hasFiles ? (
        <div className="text-muted-foreground">No files uploaded.</div>
      ) : (
        <ul className="space-y-2">
          {files.map((p) => {
            const kind = getFileKind(p)
            const canPreview = kind === 'image' || kind === 'pdf'
            return (
              <li key={p} className="flex items-center justify-between gap-3">
                <span className="break-all">{getFileName(p)}</span>
                <div className="shrink-0 flex items-center gap-2">
                  {canPreview && (
                    <Button data-testid="preview-file" variant="outline" size="sm" onClick={() => handlePreview(p)} disabled={isPending}>
                      Preview
                    </Button>
                  )}
                  <Button data-testid="download-file" size="sm" onClick={() => handleDownload(p)} disabled={isPending}>
                    Download
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewName || 'Preview'}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {!previewUrl ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : previewKind === 'image' ? (
              <div className="rounded-md border overflow-hidden">
                {/* Use img to avoid remote domain config */}
                <img src={previewUrl} alt={previewName} className="max-h-[70vh] w-auto mx-auto" />
              </div>
            ) : previewKind === 'pdf' ? (
              <div className="rounded-md border overflow-hidden">
                <iframe src={previewUrl} className="w-full h-[70vh]" title={previewName} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No preview available. Use Download to view this file.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


