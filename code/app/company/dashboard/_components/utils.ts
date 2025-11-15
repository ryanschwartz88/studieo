import { formatDistanceToNow } from "date-fns"

export interface ApplicationData {
  created_at: string
  status: string
}

export interface ChartDataPoint {
  date: string
  applications: number
}

/**
 * Aggregate applications by date for chart display
 */
export function aggregateApplicationsByDate(
  applications: ApplicationData[],
  days: number
): ChartDataPoint[] {
  // Create a map of dates to counts
  const dateMap = new Map<string, number>()
  
  // Calculate start date
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)
  
  // Initialize all dates in range with 0
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]
    dateMap.set(dateStr, 0)
  }
  
  // Count applications by date
  applications.forEach((app) => {
    const appDate = new Date(app.created_at)
    if (appDate >= startDate) {
      const dateStr = appDate.toISOString().split('T')[0]
      const current = dateMap.get(dateStr) || 0
      dateMap.set(dateStr, current + 1)
    }
  })
  
  // Convert to array and sort
  return Array.from(dateMap.entries())
    .map(([date, applications]) => ({ date, applications }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Filter chart data by time range
 */
export function filterByDateRange(
  data: ChartDataPoint[],
  range: '7d' | '30d' | '90d'
): ChartDataPoint[] {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)
  
  return data.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= startDate
  })
}

/**
 * Format date as relative time (e.g., "2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  } catch {
    return 'Unknown'
  }
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

