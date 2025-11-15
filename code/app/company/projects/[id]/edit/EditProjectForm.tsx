'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, CheckCircle2, Upload, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import {
  PROJECT_TYPE_OPTIONS,
  SUGGESTED_SKILLS,
  PROJECT_ACCESS_TYPE,
  COLLABORATION_STYLES,
  MENTORSHIP_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  type CreateProjectInput,
} from '@/lib/schemas/projects'
import { updateProjectFull, uploadResourceFiles } from '@/lib/actions/projects'

export default function EditProjectForm({ project }: { project: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState(project.title || '')
  const [shortSummary, setShortSummary] = useState(project.short_summary || '')
  const [projectTypes, setProjectTypes] = useState<string[]>(project.project_type || [])
  const [customProjectTypeInput, setCustomProjectTypeInput] = useState('')
  
  const [detailedDescription, setDetailedDescription] = useState(project.detailed_description || '')
  const [deliverables, setDeliverables] = useState(project.deliverables || '')
  
  const [accessType, setAccessType] = useState(project.access_type || 'OPEN')
  const [minStudents, setMinStudents] = useState(project.min_students || 1)
  const [maxStudents, setMaxStudents] = useState(project.max_students || 1)
  const [maxTeams, setMaxTeams] = useState<number | null>(project.max_teams || null)
  const [weeklyHours, setWeeklyHours] = useState(project.weekly_hours || 1)
  
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>(project.skills_needed || [])
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [collaborationStyle, setCollaborationStyle] = useState(project.collaboration_style || 'Remote')
  const [mentorship, setMentorship] = useState(project.mentorship || 'YES')
  
  const [startDate, setStartDate] = useState<Date | undefined>(
    project.start_date ? new Date(project.start_date) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    project.end_date ? new Date(project.end_date) : undefined
  )
  const [openDate, setOpenDate] = useState<Date | undefined>(
    project.open_date ? new Date(project.open_date) : undefined
  )
  const [resourceLinks, setResourceLinks] = useState(project.resource_links || '')
  const [existingResourceFiles] = useState<string[]>(project.resource_files || [])
  const [newResourceFiles, setNewResourceFiles] = useState<File[]>([])
  
  const currentYear = new Date().getFullYear()

  // Helper to prettify option labels (remove underscores, title case, preserve acronyms)
  function prettifyLabel(value: string): string {
    const acronyms = ['NDA']
    return value
      .split('_')
      .map((word) => {
        const upperWord = word.toUpperCase()
        if (acronyms.includes(upperWord)) {
          return upperWord
        }
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      })
      .join(' ')
  }
  
  const [contactName, setContactName] = useState(project.contact_name || '')
  const [contactRole, setContactRole] = useState(project.contact_role || '')
  const [contactEmail, setContactEmail] = useState(project.contact_email || '')
  const [confidentiality, setConfidentiality] = useState(project.confidentiality || 'PUBLIC')
  const [internalNotes, setInternalNotes] = useState(project.internal_notes || '')
  const [location, setLocation] = useState(project.location || '')

  function toggleProjectType(type: string) {
    if (projectTypes.includes(type)) {
      setProjectTypes(projectTypes.filter((t) => t !== type))
    } else if (projectTypes.length < 3) {
      setProjectTypes([...projectTypes, type])
    }
  }

  function removeProjectType(type: string) {
    setProjectTypes(projectTypes.filter((t) => t !== type))
  }

  function addCustomProjectType() {
    const trimmed = customProjectTypeInput.trim()
    if (!trimmed) return
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Project type must be between 2 and 30 characters')
      return
    }
    if (!/^[a-zA-Z0-9\s\-&/]+$/.test(trimmed)) {
      setError('Project type can only contain letters, numbers, spaces, hyphens, and &/')
      return
    }
    if (projectTypes.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setError('This project type has already been added')
      return
    }
    if (projectTypes.length >= 3) {
      setError('Maximum 3 project types allowed')
      return
    }
    setProjectTypes([...projectTypes, trimmed])
    setCustomProjectTypeInput('')
    setError(null)
  }

  function toggleSkill(skill: string) {
    if (skillsNeeded.includes(skill)) {
      setSkillsNeeded(skillsNeeded.filter((s) => s !== skill))
    } else if (skillsNeeded.length < 10) {
      setSkillsNeeded([...skillsNeeded, skill])
    }
  }

  function removeSkill(skill: string) {
    setSkillsNeeded(skillsNeeded.filter((s) => s !== skill))
  }

  function addCustomSkill() {
    const trimmed = customSkillInput.trim()
    if (!trimmed) return
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Skill must be between 2 and 30 characters')
      return
    }
    if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
      setError('Skill can only contain letters, numbers, spaces, and hyphens')
      return
    }
    if (skillsNeeded.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError('This skill has already been added')
      return
    }
    if (skillsNeeded.length >= 10) {
      setError('Maximum 10 skills allowed')
      return
    }
    setSkillsNeeded([...skillsNeeded, trimmed])
    setCustomSkillInput('')
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setNewResourceFiles([...newResourceFiles, ...filesArray])
    }
  }

  const removeNewFile = (index: number) => {
    setNewResourceFiles(newResourceFiles.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    
    if (!startDate || !endDate) {
      setError('Start date and end date are required')
      return
    }
    
    startTransition(async () => {
      try {
        // Upload new resource files if any, preserving existing ones
        let allFileUrls: string[] = [...existingResourceFiles]
        if (newResourceFiles.length > 0) {
          const uploadResult = await uploadResourceFiles(newResourceFiles, project.id)
          if (uploadResult.success && uploadResult.urls) {
            // Combine existing files with newly uploaded ones
            allFileUrls = [...existingResourceFiles, ...uploadResult.urls]
          } else if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload files')
          }
        }

        const payload: CreateProjectInput = {
          title,
          short_summary: shortSummary,
          project_type: projectTypes as any,
          detailed_description: detailedDescription,
          deliverables,
          access_type: accessType as any,
          min_students: Number(minStudents),
          max_students: Number(maxStudents),
          max_teams: maxTeams === null ? null : Number(maxTeams),
          weekly_hours: Number(weeklyHours),
          skills_needed: skillsNeeded as any,
          collaboration_style: collaborationStyle as any,
          mentorship: mentorship as any,
          start_date: startDate,
          end_date: endDate,
          ...(openDate ? { open_date: openDate } : {}),
          resource_links: resourceLinks || undefined,
          resource_files: allFileUrls,
          internal_notes: internalNotes || undefined,
          location: location || undefined,
          contact_name: contactName,
          contact_role: contactRole,
          contact_email: contactEmail,
          confidentiality: confidentiality as any,
          tags: project.tags || [],
        }

        const res = await updateProjectFull(project.id, payload)
        if ((res as any)?.error) {
          setError((res as any).error)
          return
        }
        router.push(`/company/projects/${project.id}`)
      } catch (err: any) {
        setError(err.message || 'Failed to update project')
      }
    })
  }

  async function handleSaveDraft() {
    setError(null)
    startTransition(async () => {
      try {
        // Preserve existing + new uploads
        let allFileUrls: string[] = [...existingResourceFiles]
        if (newResourceFiles.length > 0) {
          const uploadResult = await uploadResourceFiles(newResourceFiles, project.id)
          if (uploadResult.success && uploadResult.urls) {
            allFileUrls = [...existingResourceFiles, ...uploadResult.urls]
          } else if (!uploadResult.success) {
            throw new Error(uploadResult.error || 'Failed to upload files')
          }
        }

        const payload: CreateProjectInput = {
          title,
          short_summary: shortSummary,
          project_type: projectTypes as any,
          detailed_description: detailedDescription,
          deliverables,
          access_type: accessType as any,
          min_students: Number(minStudents),
          max_students: Number(maxStudents),
          max_teams: maxTeams === null ? null : Number(maxTeams),
          weekly_hours: Number(weeklyHours),
          skills_needed: skillsNeeded as any,
          collaboration_style: collaborationStyle as any,
          mentorship: mentorship as any,
          start_date: startDate || new Date(),
          end_date: endDate || new Date(),
          ...(openDate ? { open_date: openDate } : {}),
          resource_links: resourceLinks || undefined,
          resource_files: allFileUrls,
          internal_notes: internalNotes || undefined,
          location: location || undefined,
          contact_name: contactName,
          contact_role: contactRole,
          contact_email: contactEmail,
          confidentiality: confidentiality as any,
          tags: project.tags || [],
        }

        const res = await updateProjectFull(project.id, payload, { draft: true })
        if ((res as any)?.error) {
          setError((res as any).error)
          return
        }
        router.push(`/company/projects/${project.id}`)
      } catch (err: any) {
        setError(err.message || 'Failed to save draft')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Overview Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Overview</h2>
        <div>
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 h-11"
            maxLength={200}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">{title.length}/200 characters</p>
        </div>

        <div>
          <Label htmlFor="summary">Short Summary *</Label>
          <Textarea
            id="summary"
            value={shortSummary}
            onChange={(e) => setShortSummary(e.target.value)}
            className="mt-2"
            rows={3}
            maxLength={200}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">{shortSummary.length}/200 characters</p>
        </div>

        <div>
          <Label>Project Type * (Select 1-3)</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Choose from suggested categories or add your own
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {PROJECT_TYPE_OPTIONS.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleProjectType(type)}
                className={cn(
                  'px-4 py-2 rounded-full border text-sm transition-all',
                  'hover:border-foreground hover:bg-accent/50',
                  projectTypes.includes(type) && 'border-primary bg-primary text-primary-foreground',
                  projectTypes.length >= 3 && !projectTypes.includes(type) && 'opacity-50 cursor-not-allowed'
                )}
                disabled={projectTypes.length >= 3 && !projectTypes.includes(type)}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="custom-type">Add Custom Type</Label>
            <div className="flex gap-2">
              <Input
                id="custom-type"
                value={customProjectTypeInput}
                onChange={(e) => setCustomProjectTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomProjectType()
                  }
                }}
                placeholder="e.g., Brand Strategy, UX Research..."
                disabled={projectTypes.length >= 3}
                className="flex-1"
                maxLength={30}
              />
              <Button
                type="button"
                onClick={addCustomProjectType}
                disabled={projectTypes.length >= 3 || !customProjectTypeInput.trim()}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
            <Label className="text-sm">Selected Types ({projectTypes.length}/3)</Label>
            <div className="flex flex-wrap gap-2">
              {projectTypes.length > 0 ? (
                projectTypes.map((type) => (
                  <Badge key={type} variant="secondary" className="px-3 py-1">
                    {type}
                    <button
                      type="button"
                      onClick={() => removeProjectType(type)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No types selected yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Details Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Details</h2>
        <div>
          <Label htmlFor="description">Detailed Description *</Label>
          <Textarea
            id="description"
            value={detailedDescription}
            onChange={(e) => setDetailedDescription(e.target.value)}
            className="mt-2"
            rows={8}
            maxLength={2000}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">{detailedDescription.length}/2000 characters</p>
        </div>

        <div>
          <Label htmlFor="deliverables">Expected Deliverables *</Label>
          <Textarea
            id="deliverables"
            value={deliverables}
            onChange={(e) => setDeliverables(e.target.value)}
            placeholder="List the specific outputs students should produce..."
            className="mt-2"
            rows={6}
            maxLength={1000}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">{deliverables.length}/1000 characters</p>
        </div>
      </div>

      <Separator />

      {/* Team Structure Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Team Structure</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-students">Min Students *</Label>
            <Input
              id="min-students"
              type="number"
              value={minStudents}
              onChange={(e) => setMinStudents(Number(e.target.value))}
              className="mt-2 h-11"
              min={1}
              required
            />
          </div>
          <div>
            <Label htmlFor="max-students">Max Students *</Label>
            <Input
              id="max-students"
              type="number"
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              className="mt-2 h-11"
              min={1}
              required
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weekly-hours">Weekly Hours *</Label>
            <Input
              id="weekly-hours"
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
              className="mt-2 h-11"
              min={1}
              max={40}
              required
            />
          </div>
          <div>
            <Label htmlFor="max-teams">Max Teams (optional)</Label>
            <Input
              id="max-teams"
              type="number"
              value={maxTeams ?? ''}
              onChange={(e) => setMaxTeams(e.target.value ? Number(e.target.value) : null)}
              className="mt-2 h-11"
              min={1}
              placeholder="Unlimited"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="access-type">Access Type *</Label>
          <Select value={accessType} onValueChange={setAccessType}>
            <SelectTrigger className="mt-2 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_ACCESS_TYPE.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Skills & Collaboration Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Skills & Collaboration</h2>
        <div>
          <Label>Required Skills * (Select 1-10)</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Choose from suggested skills or add your own
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {SUGGESTED_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  'px-4 py-2 rounded-full border text-sm transition-all',
                  'hover:border-foreground hover:bg-accent/50',
                  skillsNeeded.includes(skill) && 'border-primary bg-primary text-primary-foreground',
                  skillsNeeded.length >= 10 && !skillsNeeded.includes(skill) && 'opacity-50 cursor-not-allowed'
                )}
                disabled={skillsNeeded.length >= 10 && !skillsNeeded.includes(skill)}
              >
                {skill}
              </button>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            <Label htmlFor="custom-skill">Add Custom Skill</Label>
            <div className="flex gap-2">
              <Input
                id="custom-skill"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCustomSkill()
                  }
                }}
                placeholder="e.g., 3D Modeling, Tableau, Webflow..."
                disabled={skillsNeeded.length >= 10}
                className="flex-1"
                maxLength={30}
              />
              <Button
                type="button"
                onClick={addCustomSkill}
                disabled={skillsNeeded.length >= 10 || !customSkillInput.trim()}
                variant="outline"
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
            <Label className="text-sm">Selected Skills ({skillsNeeded.length}/10)</Label>
            <div className="flex flex-wrap gap-2">
              {skillsNeeded.length > 0 ? (
                skillsNeeded.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No skills selected yet</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="collaboration">Collaboration Style *</Label>
            <Select value={collaborationStyle} onValueChange={setCollaborationStyle}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLLABORATION_STYLES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="mentorship">Mentorship *</Label>
            <Select value={mentorship} onValueChange={setMentorship}>
              <SelectTrigger className="mt-2 h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MENTORSHIP_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {(collaborationStyle === 'Hybrid' || collaborationStyle === 'In-person') && (
          <div>
            <Label htmlFor="location">Project Location *</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              className="mt-2 h-11"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">{location.length}/100 characters</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Timeline & Resources Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline & Resources</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? startDate.toLocaleDateString() : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={startDate}
                  onSelect={setStartDate}
                  defaultMonth={startDate ?? new Date()}
                  startMonth={new Date(currentYear, 0, 1)}
                  endMonth={new Date(currentYear + 4, 11, 1)}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const d = new Date(date)
                    d.setHours(0, 0, 0, 0)
                    if (project.status === 'IN_PROGRESS') {
                      // Block moving start date to the future
                      if (d > today) return true
                    } else {
                      // Default: no past dates
                      if (d < today) return true
                    }
                    if (endDate) {
                      const e = new Date(endDate)
                      e.setHours(0, 0, 0, 0)
                      if (d > e) return true
                    }
                    return false
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal h-11',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? endDate.toLocaleDateString() : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={endDate}
                  onSelect={setEndDate}
                  defaultMonth={endDate ?? (startDate ?? new Date())}
                  startMonth={new Date(currentYear, 0, 1)}
                  endMonth={new Date(currentYear + 4, 11, 1)}
                  disabled={(date) => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const d = new Date(date)
                    d.setHours(0, 0, 0, 0)
                    if (d < today) return true
                    if (startDate) {
                      const s = new Date(startDate)
                      s.setHours(0, 0, 0, 0)
                      if (d < s) return true
                    }
                    return false
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Release Date (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            When the project should become available for applications. Set to today if left blank.
          </p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-11',
                  !openDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {openDate ? openDate.toLocaleDateString() : 'Select schedule date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={openDate}
                onSelect={setOpenDate}
                defaultMonth={openDate ?? new Date()}
                startMonth={new Date(currentYear, 0, 1)}
                endMonth={new Date(currentYear + 4, 11, 1)}
                disabled={(date) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const dateToCheck = new Date(date)
                  dateToCheck.setHours(0, 0, 0, 0)
                  if (dateToCheck < today) return true
                  // Only enforce start_date constraint for INCOMPLETE or SCHEDULED status
                  if ((project.status === 'INCOMPLETE' || project.status === 'SCHEDULED') && startDate) {
                    const maxDate = new Date(startDate)
                    maxDate.setDate(maxDate.getDate() - 1)
                    maxDate.setHours(0, 0, 0, 0)
                    if (dateToCheck > maxDate) return true
                  }
                  return false
                }}
              />
            </PopoverContent>
          </Popover>
          {openDate && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpenDate(undefined)}
              className="text-xs"
            >
              Clear schedule date
            </Button>
          )}
        </div>

        <div>
          <Label htmlFor="resource-files">Resource Files (Optional)</Label>
          <p className="text-sm text-muted-foreground mt-1 mb-3">
            Upload additional files. Existing files will be preserved.
          </p>
          <div className="space-y-3">
            <label
              htmlFor="resource-files"
              className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:border-foreground transition-colors"
            >
              <Upload className="h-5 w-5" />
              <span className="text-sm font-medium">Click to upload new files</span>
              <input
                id="resource-files"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {existingResourceFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Existing Files ({existingResourceFiles.length})</p>
                {existingResourceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg bg-muted"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{file.split('/').pop()}</span>
                  </div>
                ))}
              </div>
            )}

            {newResourceFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">New Files to Upload ({newResourceFiles.length})</p>
                {newResourceFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="resource-links">Resource Links (Optional)</Label>
          <Textarea
            id="resource-links"
            value={resourceLinks}
            onChange={(e) => setResourceLinks(e.target.value)}
            placeholder="Add links to relevant resources (one per line)..."
            className="mt-2"
            rows={4}
          />
        </div>
      </div>

      <Separator />

      {/* Contact & Confidentiality Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contact & Confidentiality</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="contact-name">Contact Name *</Label>
            <Input
              id="contact-name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="mt-2 h-11"
              maxLength={100}
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-role">Contact Role *</Label>
            <Input
              id="contact-role"
              value={contactRole}
              onChange={(e) => setContactRole(e.target.value)}
              className="mt-2 h-11"
              maxLength={100}
              required
            />
          </div>
          <div>
            <Label htmlFor="contact-email">Contact Email *</Label>
            <Input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="mt-2 h-11"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="confidentiality">Confidentiality *</Label>
          <Select value={confidentiality} onValueChange={setConfidentiality}>
            <SelectTrigger className="mt-2 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONFIDENTIALITY_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{prettifyLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
          <Textarea
            id="internal-notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="Notes visible only to your team..."
            className="mt-2"
            rows={4}
            maxLength={1000}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
        {project.status === 'INCOMPLETE' && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Save Draft'}
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
