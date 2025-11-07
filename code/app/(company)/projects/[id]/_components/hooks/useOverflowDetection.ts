'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Detects if content overflows its container
 * @returns [ref, isOverflowing] - Attach ref to the content element
 */
export function useOverflowDetection<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const checkOverflow = () => {
      // Check if content is larger than container
      const hasVerticalOverflow = element.scrollHeight > element.clientHeight
      const hasHorizontalOverflow = element.scrollWidth > element.clientWidth
      setIsOverflowing(hasVerticalOverflow || hasHorizontalOverflow)
    }

    // Initial check
    checkOverflow()

    // Re-check on window resize
    const resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(element)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  return [ref, isOverflowing] as const
}

