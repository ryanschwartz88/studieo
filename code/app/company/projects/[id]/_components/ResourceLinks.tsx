'use client'

function normalizeToUrl(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const hasProtocol = /^https?:\/\//i.test(trimmed)
  const candidate = hasProtocol ? trimmed : `https://${trimmed}`
  try {
    // URL constructor will throw if invalid
    const u = new URL(candidate)
    return u.toString()
  } catch {
    return null
  }
}

function parseLinks(input?: string | null): string[] {
  if (!input) return []
  return input
    .split(/\s+/)
    .map((s) => normalizeToUrl(s))
    .filter((v): v is string => Boolean(v))
}

export function ResourceLinks({ value }: { value?: string | null }) {
  const links = parseLinks(value)
  if (links.length === 0) {
    return <div className="text-muted-foreground">No links provided.</div>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((href) => {
        const hostname = (() => {
          try { return new URL(href).hostname } catch { return href }
        })()
        return (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border px-3 py-1 text-xs hover:bg-accent hover:text-accent-foreground"
            data-testid="resource-link"
          >
            {hostname}
          </a>
        )
      })}
    </div>
  )
}


