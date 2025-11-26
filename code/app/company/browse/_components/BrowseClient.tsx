"use client"

import { useState, useEffect, useId, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence } from "motion/react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Info, Search, SlidersHorizontal, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { ProjectCard } from "./ProjectCard"
import { ProjectModal } from "./ProjectModal"
import { Filters } from "./Filters"
import { Project } from "./types"

interface BrowseClientProps {
  initialProjects: Project[]
  userCompanyId: string | null
}

export function BrowseClient({ initialProjects, userCompanyId }: BrowseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = useId()
  const modalRef = useRef<HTMLDivElement>(null)

  // Modal state
  const [activeProject, setActiveProject] = useState<Project | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  // Access filter: OPEN or CLOSED (access_type)
  const [accessFilter, setAccessFilter] = useState<string>((searchParams.get('access') || 'ALL').toUpperCase())
  const [teamSizeRange, setTeamSizeRange] = useState<[number, number]>([
    Number(searchParams.get('teamMin')) || 1,
    Number(searchParams.get('teamMax')) || 11, // 11 represents 10+
  ])
  const [maxTeams, setMaxTeams] = useState(searchParams.get('maxTeams') || '10')
  const [unlimitedTeams, setUnlimitedTeams] = useState(searchParams.get('unlimited') !== 'false')
  const [collaboration, setCollaboration] = useState<string[]>(
    searchParams.get('collab')?.split(',').filter(Boolean) || []
  )
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [weeklyHours, setWeeklyHours] = useState<string[]>(
    searchParams.get('hours')?.split(',').filter(Boolean) || []
  )
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'updated_desc')
  const [showFilters, setShowFilters] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(false)

  // Debounced URL updates for all filters
  useEffect(() => {
    const timer = setTimeout(() => {
      updateURL()
    }, 300) // 300ms debounce for all filter changes
    return () => clearTimeout(timer)
  }, [searchQuery, accessFilter, teamSizeRange, maxTeams, unlimitedTeams, collaboration, location, weeklyHours, sortBy])

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (accessFilter !== 'ALL') params.set('access', accessFilter)
    if (teamSizeRange[0] !== 1) params.set('teamMin', String(teamSizeRange[0]))
    if (teamSizeRange[1] !== 11) params.set('teamMax', String(teamSizeRange[1]))
    if (maxTeams && !unlimitedTeams) params.set('maxTeams', maxTeams)
    if (!unlimitedTeams) params.set('unlimited', 'false')
    if (collaboration.length > 0) params.set('collab', collaboration.join(','))
    if (location) params.set('location', location)
    if (weeklyHours.length > 0) params.set('hours', weeklyHours.join(','))
    if (sortBy !== 'updated_desc') params.set('sort', sortBy)

    const queryString = params.toString()
    router.push(`/company/browse${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }

  const clearFilters = () => {
    setSearchQuery('')
    setAccessFilter('ALL')
    setTeamSizeRange([1, 11])
    setMaxTeams('10')
    setUnlimitedTeams(true)
    setCollaboration([])
    setLocation('')
    setWeeklyHours([])
    setSortBy('updated_desc')
  }

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeProject) {
        setActiveProject(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeProject])

  // Body scroll lock
  useEffect(() => {
    if (activeProject) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [activeProject])

  useOutsideClick(modalRef, () => setActiveProject(null))

  const hasActiveFilters = searchQuery || accessFilter !== 'ALL' || teamSizeRange[0] !== 1 || 
    teamSizeRange[1] !== 11 || (maxTeams !== '10' && !unlimitedTeams) || !unlimitedTeams || 
    collaboration.length > 0 || location || weeklyHours.length > 0

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Top bar - Full width with filters */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-6 mb-6 border-b pt-4 overflow-visible">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Browse</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 hidden sm:flex">
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="md:hidden gap-2"
                onClick={() => setFiltersExpanded(!filtersExpanded)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden hidden sm:flex"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search projects or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-lg border-none bg-muted/50 dark:bg-neutral-800/80 dark:border dark:border-neutral-700/50"
              data-testid="search-input"
            />
          </div>

          {/* Filters row - Labels above controls */}
          <div className={`md:flex flex-col md:flex-row items-start gap-4 md:gap-4 md:divide-x md:divide-border dark:md:divide-neutral-700 transition-all duration-200 ${filtersExpanded ? 'flex max-h-[1000px] opacity-100 overflow-visible' : 'hidden md:flex max-h-0 md:max-h-none opacity-0 md:opacity-100 overflow-hidden md:overflow-visible'}`}>
            {/* Access filter */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto md:pr-4 group md:h-[52px]">
              <Label className="text-xs font-medium text-muted-foreground h-4">Access Type</Label>
              <div className="flex items-center gap-2 h-10">
                <Select value={accessFilter} onValueChange={(v) => setAccessFilter(v.toUpperCase())}>
                  <SelectTrigger className="h-10 w-full md:min-w-[140px] border-none shadow-none focus:ring-0" data-testid="access-filter">
                    <SelectValue placeholder="Access" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All projects</SelectItem>
                    <SelectItem value="OPEN">Open access</SelectItem>
                    <SelectItem value="CLOSED">Selective access</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" 
                      aria-label="Access info"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm">
                    <div className="space-y-2">
                      <div className="font-semibold">Access types</div>
                      <div><span className="font-medium">Open</span>: Students can join instantly and begin contributing without company review.</div>
                      <div><span className="font-medium">Selective</span>: Company reviews and approves each application.</div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Team size slider */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto md:px-4 group md:h-[52px]">
              <Label className="text-xs font-medium text-muted-foreground h-4">Team Size</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:h-[30px]">
                <div className="flex-1 w-full sm:min-w-[220px]">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Min</span>
                    <span>Max</span>
                  </div>
                  <Slider
                    value={teamSizeRange}
                    onValueChange={(value) => setTeamSizeRange(value as [number, number])}
                    min={1}
                    max={11}
                    step={1}
                    data-testid="team-size-slider"
                  />
                </div>
                <div className="text-sm font-medium whitespace-nowrap text-foreground dark:text-neutral-200 self-center sm:self-auto">
                  {teamSizeRange[0]} - {teamSizeRange[1] === 11 ? '10+' : teamSizeRange[1]}
                </div>
              </div>
            </div>

            {/* Max teams */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto md:px-4 md:h-[52px]">
              <Label htmlFor="max-teams" className="text-xs font-medium text-muted-foreground h-4">Max Teams</Label>
              <div className="flex items-center gap-2 h-10">
                <Input
                  id="max-teams"
                  type="number"
                  value={maxTeams}
                  onChange={(e) => setMaxTeams(e.target.value)}
                  disabled={unlimitedTeams}
                  className="w-14 h-10 border-none bg-muted/50 dark:bg-neutral-800/80 dark:border dark:border-neutral-700/50"
                  min="1"
                  data-testid="max-teams-input"
                />
                <div className="flex items-center gap-1.5">
                  <Switch
                    id="unlimited"
                    checked={unlimitedTeams}
                    onCheckedChange={setUnlimitedTeams}
                    data-testid="unlimited-switch"
                  />
                  <Label htmlFor="unlimited" className="text-sm cursor-pointer">Unlimited</Label>
                </div>
              </div>
            </div>

            {/* Sort dropdown */}
            <div className="flex flex-col gap-1.5 w-full md:w-auto md:pl-4 md:ml-auto md:h-[52px]">
              <Label className="text-xs font-medium text-muted-foreground h-4">Sort By</Label>
              <div className="h-10">
                <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-full md:w-[180px] border-none shadow-none focus:ring-0" data-testid="sort-dropdown">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {searchQuery && (
                    <SelectItem value="relevance">Relevance</SelectItem>
                  )}
                  <SelectItem value="updated_desc">Last Updated</SelectItem>
                  <SelectItem value="earliest_deadline">Earliest Deadline</SelectItem>
                  <SelectItem value="most_viewed">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </div>
        </div>

      {/* Content area with grid and floating sidebar */}
      <div className="flex gap-6 items-start">
        {/* Project grid */}
        <div className="flex-1">
          {initialProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search criteria</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {initialProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setActiveProject(project)}
                  layoutId={`${project.id}-${id}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Floating sidebar filters (desktop) */}
        <div className="hidden lg:block sticky top-[230px]">
          {sidebarCollapsed ? (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarCollapsed(false)}
              className="h-12 w-12 rounded-xl shadow-lg"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-[320px] rounded-xl border bg-background shadow-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Filters content */}
              <div className="p-4 max-h-[calc(100vh-220px)] overflow-auto">
                <Filters
                  collaboration={collaboration}
                  onCollaborationChange={setCollaboration}
                  location={location}
                  onLocationChange={setLocation}
                  weeklyHours={weeklyHours}
                  onWeeklyHoursChange={setWeeklyHours}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile filters overlay */}
        {showFilters && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/20" onClick={() => setShowFilters(false)}>
            <div 
              className="fixed right-0 top-0 h-full w-80 bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Filters</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 overflow-auto h-[calc(100%-4rem)]">
                <Filters
                  collaboration={collaboration}
                  onCollaborationChange={setCollaboration}
                  location={location}
                  onLocationChange={setLocation}
                  weeklyHours={weeklyHours}
                  onWeeklyHoursChange={setWeeklyHours}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal overlay */}
      <AnimatePresence>
        {activeProject && (
          <ProjectModal
            key={activeProject.id}
            ref={modalRef}
            project={activeProject}
            onClose={() => setActiveProject(null)}
            layoutId={`${activeProject.id}-${id}`}
          />
        )}
      </AnimatePresence>

    </div>
  )
}

export function BrowseClientSkeleton() {
  return (
    <div className="flex min-h-screen relative">
      <div className="flex-1 p-4 sm:p-6 lg:pr-[340px]">
        <div className="sticky top-0 z-10 bg-background pb-6 mb-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden shadow-md bg-white dark:bg-neutral-900 animate-pulse">
              <div className="h-48 bg-neutral-200 dark:bg-neutral-800" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <div className="flex gap-2 justify-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <div className="p-4 border-t flex justify-between items-center">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden lg:block fixed right-0 top-0 h-full w-80 border-l bg-background p-6">
        <Skeleton className="h-6 w-24 mb-6" />
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

