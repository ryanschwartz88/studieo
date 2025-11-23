import { formatDistanceToNow } from "date-fns"

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
