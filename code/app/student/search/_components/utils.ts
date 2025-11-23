// Utility functions for student browse page

/**
 * Generate deterministic pastel color from company ID
 * Returns theme-aware colors that are easy on the eyes in both light and dark modes
 */
export function getPastelColor(companyId: string, isDark: boolean = false): string {
  // Light mode gradients (soft, pastel, top-left to bottom-right)
  const lightGradients = [
    'linear-gradient(135deg, #D6F6ED 0%, #E0F3FF 100%)', // Mint to Blue
    'linear-gradient(135deg, #FFE2CB 0%, #FBE2F3 100%)', // Peach to Pink
    'linear-gradient(135deg, #E2DBFA 0%, #E0F3FF 100%)', // Lavender to Blue
    'linear-gradient(135deg, #E0F3FF 0%, #D6F6ED 100%)', // Blue to Mint
    'linear-gradient(135deg, #FBE2F3 0%, #E2DBFA 100%)'  // Pink to Lavender
  ]

  // Dark mode gradients (richer, deeper, top-left to bottom-right)
  const darkGradients = [
    'linear-gradient(135deg, #0F4A3A 0%, #1A2E4A 100%)', // Teal to Blue
    'linear-gradient(135deg, #4A2E1A 0%, #4A1A2E 100%)', // Orange-brown to Pink
    'linear-gradient(135deg, #3A2E4A 0%, #1A2E4A 100%)', // Purple to Blue
    'linear-gradient(135deg, #1A2E4A 0%, #0F4A3A 100%)', // Blue to Teal
    'linear-gradient(135deg, #4A1A2E 0%, #3A2E4A 100%)'  // Pink to Purple
  ]

  let hash = 0
  for (const char of companyId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }
  const index = hash % lightGradients.length
  return isDark ? darkGradients[index] : lightGradients[index]
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

