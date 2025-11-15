// Utility functions for student browse page

/**
 * Generate deterministic pastel color from company ID
 * Returns theme-aware colors that are easy on the eyes in both light and dark modes
 */
export function getPastelColor(companyId: string, isDark: boolean = false): string {
  // Light mode pastels (original)
  const lightColors = ['#D6F6ED', '#FFE2CB', '#E2DBFA', '#E0F3FF', '#FBE2F3']
  // Dark mode pastels (improved visibility - lighter, more saturated but still muted)
  const darkColors = [
    '#0F4A3A', // Teal - darker but visible
    '#4A2E1A', // Orange-brown
    '#3A2E4A', // Purple
    '#1A2E4A', // Blue
    '#4A1A2E'  // Pink
  ]
  
  let hash = 0
  for (const char of companyId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const index = hash % lightColors.length
  return isDark ? darkColors[index] : lightColors[index]
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | null): string {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Get company initials for avatar fallback
 */
export function getCompanyInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format team size range
 */
export function formatTeamSize(min: number | null, max: number | null): string {
  if (!min && !max) return '—'
  if (!max) return `${min}+ students`
  if (!min) return `Up to ${max} students`
  if (min === max) return `${min} student${min > 1 ? 's' : ''}`
  return `${min}–${max} students`
}

/**
 * Format max teams
 */
export function formatMaxTeams(maxTeams: number | null): string {
  if (!maxTeams) return 'Unlimited'
  return `${maxTeams} team${maxTeams > 1 ? 's' : ''}`
}

