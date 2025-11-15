"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { MapPin, Clock } from "lucide-react"

interface FiltersProps {
  collaboration: string[]
  onCollaborationChange: (values: string[]) => void
  location: string
  onLocationChange: (value: string) => void
  weeklyHours: string[]
  onWeeklyHoursChange: (values: string[]) => void
}

const COLLABORATION_OPTIONS = [
  { value: 'Remote', label: 'Remote' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'In-person', label: 'In-person' },
]

const WEEKLY_HOURS_OPTIONS = [
  { value: '1-5', label: '1-5 hours' },
  { value: '5-10', label: '5-10 hours' },
  { value: '10-15', label: '10-15 hours' },
  { value: '15-20', label: '15-20 hours' },
  { value: '20+', label: '20+ hours' },
]

export function Filters({
  collaboration,
  onCollaborationChange,
  location,
  onLocationChange,
  weeklyHours,
  onWeeklyHoursChange,
}: FiltersProps) {
  const showLocationInput = collaboration.includes('Hybrid') || collaboration.includes('In-person')

  const handleCollaborationToggle = (value: string) => {
    if (collaboration.includes(value)) {
      onCollaborationChange(collaboration.filter(v => v !== value))
    } else {
      onCollaborationChange([...collaboration, value])
    }
  }

  const handleWeeklyHoursToggle = (value: string) => {
    if (weeklyHours.includes(value)) {
      onWeeklyHoursChange(weeklyHours.filter(v => v !== value))
    } else {
      onWeeklyHoursChange([...weeklyHours, value])
    }
  }

  return (
    <div className="space-y-6">
      {/* Collaboration Style */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Collaboration Style</h3>
        </div>
        <div className="space-y-3">
          {COLLABORATION_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`collab-${option.value}`}
                checked={collaboration.includes(option.value)}
                onCheckedChange={() => handleCollaborationToggle(option.value)}
                data-testid={`collab-filter-${option.value.toLowerCase()}`}
              />
              <Label
                htmlFor={`collab-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>

        {/* Location input (conditional) */}
        {showLocationInput && (
          <div className="pl-6 pt-2">
            <Input
              placeholder="Enter location..."
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="h-9"
              data-testid="location-input"
            />
          </div>
        )}
      </div>

      <Separator />

      {/* Weekly Commitment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Weekly Commitment</h3>
        </div>
        <div className="space-y-3">
          {WEEKLY_HOURS_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`hours-${option.value}`}
                checked={weeklyHours.includes(option.value)}
                onCheckedChange={() => handleWeeklyHoursToggle(option.value)}
                data-testid={`hours-filter-${option.value}`}
              />
              <Label
                htmlFor={`hours-${option.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

