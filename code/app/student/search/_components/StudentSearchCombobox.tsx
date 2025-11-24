"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchStudents } from "@/lib/actions/students"
import { cn } from "@/lib/utils"

type Student = {
  id: string
  name: string | null
  email: string
  school_name?: string | null
}

interface StudentSearchComboboxProps {
  selectedStudents: Student[]
  onSelect: (student: Student) => void
  disabled?: boolean
}

export function StudentSearchCombobox({ 
  selectedStudents, 
  onSelect,
  disabled 
}: StudentSearchComboboxProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [allStudents, setAllStudents] = React.useState<Student[]>([]) // Full dataset from server
  const [filteredStudents, setFilteredStudents] = React.useState<Student[]>([]) // Client-side filtered
  const [isLoading, setIsLoading] = React.useState(false)
  const [showResults, setShowResults] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debounceTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // Fetch students from server (debounced for typing, immediate for initial load)
  const fetchStudents = React.useCallback(async (query: string, immediate = false) => {
    setIsLoading(true)
    
    try {
      const result = await searchStudents(query)
      
      if (result.success && Array.isArray(result.students)) {
        // Server returns max 50 results (handled by RPC)
        const filtered = (result.students as Student[]).filter(
          student => !selectedStudents.find(s => s.id === student.id)
        )
        setAllStudents(filtered)
        setFilteredStudents(filtered)
      } else {
        setAllStudents([])
        setFilteredStudents([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setAllStudents([])
      setFilteredStudents([])
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudents])

  // Client-side filter (instant)
  const filterStudentsLocally = React.useCallback((query: string, students: Student[]) => {
    if (!query.trim()) {
      return students
    }

    const lowerQuery = query.toLowerCase()
    return students.filter(student => 
      student.name?.toLowerCase().includes(lowerQuery) ||
      student.email.toLowerCase().includes(lowerQuery)
    )
  }, [])

  // Handle search with smart debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(true)

    // Instant client-side filtering on existing data
    const locallyFiltered = filterStudentsLocally(query, allStudents)
    setFilteredStudents(locallyFiltered)

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Only debounce if user is actively typing (not empty query)
    if (query.trim()) {
      // Debounce server fetch (500ms)
      debounceTimerRef.current = setTimeout(() => {
        fetchStudents(query)
      }, 500)
    } else {
      // Immediate fetch for empty query (show all)
      fetchStudents(query)
    }
  }

  // Cleanup debounce timer
  React.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSelectStudent = (student: Student) => {
    onSelect(student)
    setSearchQuery('')
    setShowResults(false)
    
    // Remove selected student from local cache
    setAllStudents(prev => prev.filter(s => s.id !== student.id))
    setFilteredStudents(prev => prev.filter(s => s.id !== student.id))
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Initial load when focused (no debounce)
  const handleFocus = () => {
    setShowResults(true)
    if (allStudents.length === 0 && !isLoading) {
      fetchStudents('', true) // Immediate fetch
    }
  }

  return (
    <div ref={containerRef} className="relative p-[2px]">
      <div className="relative">
        <Input
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={handleFocus}
          disabled={disabled}
          data-testid="student-search-input"
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Results dropdown */}
      {showResults && (
        <div className="absolute z-50 w-[calc(100%-4px)] mt-1 bg-popover border rounded-lg shadow-md max-h-[300px] overflow-y-auto left-[2px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground px-4">
              {searchQuery 
                ? `No students found matching "${searchQuery}"`
                : selectedStudents.length > 0
                ? "All students have been added"
                : "Start typing to search for students"}
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => handleSelectStudent(student)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors",
                    "focus:bg-muted/50 focus:outline-none"
                  )}
                >
                  <div className="font-medium text-sm">{student.name || 'No name'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{student.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
