"use client"

// Re-export the existing shadcn popover under distinct names to avoid conflicts
// When installing the Cult UI popover, replace these exports with the actual implementation
export {
  Popover as CultPopover,
  PopoverTrigger as CultPopoverTrigger,
  PopoverContent as CultPopoverContent,
  PopoverAnchor as CultPopoverAnchor,
} from "./popover";


