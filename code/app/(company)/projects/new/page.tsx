'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Check, Loader2, Upload, X, Globe, Eye, Lock, Users, UserCheck, Building2, Infinity, Clock, Calendar as CalendarIcon, Coffee, Briefcase, Zap, Timer, Monitor, Home, Building, Lightbulb, FileText, Sparkles, Mail, Plus, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { createProject, uploadResourceFiles } from '@/lib/actions/projects';
import { createClient } from '@/lib/supabase/client';
import {
  PROJECT_TYPE_OPTIONS,
  SUGGESTED_SKILLS,
  COLLABORATION_STYLES,
  MENTORSHIP_OPTIONS,
  CONFIDENTIALITY_OPTIONS,
  MENTORSHIP_LABELS,
  CONFIDENTIALITY_LABELS,
  ACCESS_TYPE_LABELS,
  getHoursLabel,
  calculateDuration,
  type CreateProjectInput,
} from '@/lib/schemas/projects';

type Step = 'overview' | 'details' | 'team' | 'skills' | 'timeline' | 'contact';

const STEP_CONFIG = {
  overview: {
    icon: Lightbulb,
    title: 'Overview',
    subtitle: 'Define the core identity of your project: what it is, what it aims to achieve, and which categories best describe the work involved.'
  },
  details: {
    icon: FileText,
    title: 'Details',
    subtitle: 'Provide a comprehensive overview of the project scope, context, expectations, and the specific deliverables students will create.'
  },
  team: {
    icon: Users,
    title: 'Team Structure',
    subtitle: 'Configure how students will participate: team sizes, project access type, number of teams, and expected time commitment.'
  },
  skills: {
    icon: Sparkles,
    title: 'Skills & Collaboration',
    subtitle: 'Specify the required skills students should bring, how the team will work together, and the level of mentorship you\'ll provide.'
  },
  timeline: {
    icon: CalendarIcon,
    title: 'Timeline & Resources',
    subtitle: 'Set the project duration and provide helpful resources like reference files, documentation links, or background materials.'
  },
  contact: {
    icon: Mail,
    title: 'Contact & Confidentiality',
    subtitle: 'Add the primary point of contact for students, set confidentiality requirements, and include any internal notes for your team.'
  }
} as const;

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('overview');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<null | 'draft' | 'publish' | 'schedule'>(null);
  const [error, setError] = useState<string | null>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [iconSize, setIconSize] = useState<number | null>(null);

  useEffect(() => {
    const updateIconSize = () => {
      if (textContainerRef.current) {
        const height = textContainerRef.current.offsetHeight;
        setIconSize(height);
      }
    };

    // Initial measurement
    updateIconSize();

    // Update on resize
    window.addEventListener('resize', updateIconSize);
    const resizeObserver = new ResizeObserver(updateIconSize);
    
    if (textContainerRef.current) {
      resizeObserver.observe(textContainerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateIconSize);
      resizeObserver.disconnect();
    };
  }, [currentStep]);

  // Step 1: Project Overview
  const [title, setTitle] = useState('');
  const [shortSummary, setShortSummary] = useState('');
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [customProjectTypeInput, setCustomProjectTypeInput] = useState('');

  // Step 2: The Details
  const [detailedDescription, setDetailedDescription] = useState('');
  const [deliverables, setDeliverables] = useState('');

  // Step 3: Team Dynamics & Access
  const [accessType, setAccessType] = useState<string>('OPEN');
  const [minStudents, setMinStudents] = useState([2]);
  const [maxStudents, setMaxStudents] = useState([5]);
  const [unlimitedTeams, setUnlimitedTeams] = useState(true);
  const [maxTeams, setMaxTeams] = useState<number | null>(null);
  const [weeklyHours, setWeeklyHours] = useState([10]);

  // Local input strings to allow free typing without forced coercion
  const [minStudentsInput, setMinStudentsInput] = useState('2');
  const [maxStudentsInput, setMaxStudentsInput] = useState('5');
  const [maxTeamsInput, setMaxTeamsInput] = useState('');

  // Step 4: Skills & Collaboration
  const [skillsNeeded, setSkillsNeeded] = useState<string[]>([]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [collaborationStyle, setCollaborationStyle] = useState<string>('Remote');
  const [mentorship, setMentorship] = useState<string>('YES');

  // Step 5: Timeline & Resources
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [resourceFiles, setResourceFiles] = useState<File[]>([]);
  const [resourceLinks, setResourceLinks] = useState('');
  const [location, setLocation] = useState('');

  // Scheduling
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  // Step 6: Contact & Confidentiality
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactIsMyself, setContactIsMyself] = useState(false);
  const [confidentiality, setConfidentiality] = useState<string>('PUBLIC');
  const [internalNotes, setInternalNotes] = useState('');

  // Fetch user info when "contact is myself" is enabled
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (contactIsMyself) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Fetch user data from users table
          const { data: userData } = await supabase
            .from('users')
            .select('name, email, company_role')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            setContactName(userData.name || '');
            setContactEmail(userData.email || user.email || '');
            // Role is optional, so we'll leave it empty
            setContactRole(userData.company_role || '');
          } else {
            // Fallback to auth user email if no user data found
            setContactName('');
            setContactEmail(user.email || '');
            setContactRole('');
          }
        }
      }
      // When switch is turned off, fields are enabled but values remain
      // (user can manually edit them)
    };

    fetchUserInfo();
  }, [contactIsMyself]);

  const steps = {
    overview: 1,
    details: 2,
    team: 3,
    skills: 4,
    timeline: 5,
    contact: 6,
  };

  const totalSteps = Object.keys(steps).length;
  const currentStepNumber = steps[currentStep];

  // Slider display ranges (inputs can go beyond these; we expand when needed)
  const [studentsSliderMax, setStudentsSliderMax] = useState(10);
  const [teamsSliderMax, setTeamsSliderMax] = useState(50);

  function toggleProjectType(type: string) {
    if (projectTypes.includes(type)) {
      setProjectTypes(projectTypes.filter((t) => t !== type));
    } else if (projectTypes.length < 3) {
      setProjectTypes([...projectTypes, type]);
    }
  }

  function removeProjectType(type: string) {
    setProjectTypes(projectTypes.filter((t) => t !== type));
  }

  function addCustomProjectType() {
    const trimmed = customProjectTypeInput.trim();
    
    // Validation
    if (!trimmed) return;
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Project type must be between 2 and 30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9\s\-&/]+$/.test(trimmed)) {
      setError('Project type can only contain letters, numbers, spaces, hyphens, and &/');
      return;
    }
    if (projectTypes.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setError('This project type has already been added');
      return;
    }
    if (projectTypes.length >= 3) {
      setError('Maximum 3 project types allowed');
      return;
    }

    setProjectTypes([...projectTypes, trimmed]);
    setCustomProjectTypeInput('');
    setError(null);
  }

  function toggleSkill(skill: string) {
    if (skillsNeeded.includes(skill)) {
      setSkillsNeeded(skillsNeeded.filter((s) => s !== skill));
    } else if (skillsNeeded.length < 10) {
      setSkillsNeeded([...skillsNeeded, skill]);
    }
  }

  function removeSkill(skill: string) {
    setSkillsNeeded(skillsNeeded.filter((s) => s !== skill));
  }

  function addCustomSkill() {
    const trimmed = customSkillInput.trim();
    
    // Validation
    if (!trimmed) return;
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError('Skill must be between 2 and 30 characters');
      return;
    }
    if (!/^[a-zA-Z0-9\s\-]+$/.test(trimmed)) {
      setError('Skill can only contain letters, numbers, spaces, and hyphens');
      return;
    }
    if (skillsNeeded.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setError('This skill has already been added');
      return;
    }
    if (skillsNeeded.length >= 10) {
      setError('Maximum 10 skills allowed');
      return;
    }

    setSkillsNeeded([...skillsNeeded, trimmed]);
    setCustomSkillInput('');
    setError(null);
  }

  // Team size handlers - separate sliders
  const handleMinStudentsSliderChange = (values: number[]) => {
    const val = Math.round(values[0]);
    setMinStudents([val]);
    setMinStudentsInput(String(val));
    // Ensure max is at least min
    if (maxStudents[0] < val) {
      setMaxStudents([val]);
      setMaxStudentsInput(String(val));
    }
  };

  const handleMaxStudentsSliderChange = (values: number[]) => {
    const val = Math.round(values[0]);
    setMaxStudents([val]);
    setMaxStudentsInput(String(val));
    // Ensure min doesn't exceed max
    if (minStudents[0] > val) {
      setMinStudents([val]);
      setMinStudentsInput(String(val));
    }
  };

  const handleMinStudentsInputChange = (raw: string) => {
    setMinStudentsInput(raw);
    if (raw === '') return;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return;
    setMinStudents([parsed]);
    if (parsed > studentsSliderMax) setStudentsSliderMax(parsed);
    // Ensure max is at least min
    if (maxStudents[0] < parsed) {
      setMaxStudents([parsed]);
      setMaxStudentsInput(String(parsed));
    }
  };

  const handleMaxStudentsInputChange = (raw: string) => {
    setMaxStudentsInput(raw);
    if (raw === '') return;
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return;
    setMaxStudents([parsed]);
    if (parsed > studentsSliderMax) setStudentsSliderMax(parsed);
    // Ensure min doesn't exceed max
    if (minStudents[0] > parsed) {
      setMinStudents([parsed]);
      setMinStudentsInput(String(parsed));
    }
  };

  // Number of teams handler
  const handleMaxTeamsInputChange = (raw: string) => {
    setMaxTeamsInput(raw);
    if (raw === '') {
      setMaxTeams(3); // Default to 3 if empty
      setMaxTeamsInput('3');
      return;
    }
    const parsed = parseInt(raw, 10);
    if (Number.isNaN(parsed) || parsed < 1) return;
    setMaxTeams(parsed);
    setMaxTeamsInput(String(parsed));
    if (parsed > teamsSliderMax) setTeamsSliderMax(parsed);
  };

  const handleMaxTeamsSliderChange = (values: number[]) => {
    const val = Math.round(values[0]);
    setMaxTeams(val);
    setMaxTeamsInput(String(val));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setResourceFiles([...resourceFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setResourceFiles(resourceFiles.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'overview':
        return title.length >= 5 && shortSummary.length >= 20 && projectTypes.length >= 1;
      case 'details':
        return detailedDescription.length >= 100 && deliverables.length >= 50;
      case 'team':
        return minStudents[0] <= maxStudents[0];
      case 'skills':
        return skillsNeeded.length >= 1 && collaborationStyle !== '';
      case 'timeline':
        return startDate && endDate && endDate >= startDate;
      case 'contact':
        return contactName.length >= 2 && contactRole.length >= 2 && contactEmail.includes('@');
      default:
        return false;
    }
  };

  const handleNext = () => {
    const stepOrder: Step[] = ['overview', 'details', 'team', 'skills', 'timeline', 'contact'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: Step[] = ['overview', 'details', 'team', 'skills', 'timeline', 'contact'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleSubmit = async (
    status: 'INCOMPLETE' | 'SCHEDULED' | 'ACCEPTING',
    scheduledDate?: Date,
    action?: 'draft' | 'publish' | 'schedule'
  ) => {
    try {
      setLoading(true);
      setActionLoading(action ?? null);
      setError(null);

      // Upload resource files if any
      let uploadedFileUrls: string[] = [];
      if (resourceFiles.length > 0) {
        const uploadResult = await uploadResourceFiles(resourceFiles);
        if (uploadResult.success) {
          uploadedFileUrls = uploadResult.urls || [];
        } else {
          throw new Error(uploadResult.error);
        }
      }

      // Prepare form data
      const formData: CreateProjectInput = {
        title,
        short_summary: shortSummary,
        project_type: projectTypes as any,
        detailed_description: detailedDescription,
        deliverables,
        access_type: accessType as any,
        min_students: minStudents[0],
        max_students: maxStudents[0],
        max_teams: unlimitedTeams ? null : (maxTeams || null),
        weekly_hours: weeklyHours[0],
        skills_needed: skillsNeeded as any,
        collaboration_style: collaborationStyle as any,
        mentorship: mentorship as any,
        start_date: startDate!,
        end_date: endDate!,
        // Only include open_date when status is SCHEDULED
        ...(status === 'SCHEDULED' && scheduledDate ? { open_date: scheduledDate } : {}),
        resource_links: resourceLinks || undefined,
        resource_files: uploadedFileUrls,
        internal_notes: internalNotes || undefined,
        location: location || undefined,
        contact_name: contactName,
        contact_role: contactRole,
        contact_email: contactEmail,
        confidentiality: confidentiality as any,
      };

      // Create project
      const result = await createProject(formData, status, scheduledDate);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      // Success - redirect handled by createProject action
    } catch (err: any) {
      // Redirect from server actions throws NEXT_REDIRECT error, ignore showing it
      // Check multiple ways the redirect error can manifest
      const isRedirect = 
        err?.digest?.includes('NEXT_REDIRECT') ||
        err?.message?.includes('NEXT_REDIRECT') ||
        err?.digest === 'NEXT_REDIRECT' ||
        err?.name === 'RedirectError';
      
      if (isRedirect) {
        console.log('Redirect detected, navigating...');
        return;
      }
      
      console.error('Project creation error:', err);
      console.error('Error digest:', err?.digest);
      console.error('Error message:', err?.message);
      console.error('Error name:', err?.name);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Dynamic Header */}
        {(() => {
          const StepIcon = STEP_CONFIG[currentStep].icon;
          return (
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <div 
                  className="rounded-xl bg-accent flex items-center justify-center"
                  style={{ 
                    width: iconSize ?? 'auto',
                    height: iconSize ?? 'auto',
                    aspectRatio: '1',
                    minWidth: '48px',
                    minHeight: '48px'
                  }}
                >
                  <StepIcon className="h-1/2 w-1/2" style={{ 
                    width: iconSize ? `${iconSize * 0.5}px` : 'auto',
                    height: iconSize ? `${iconSize * 0.5}px` : 'auto'
                  }} />
                </div>
              </div>
              <div ref={textContainerRef} className="flex-1 space-y-2">
                <h1 className="text-3xl font-bold leading-tight">{STEP_CONFIG[currentStep].title}</h1>
                <p className="text-muted-foreground text-base leading-relaxed">
                  {STEP_CONFIG[currentStep].subtitle}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Stepper Progress */}
        <div className="flex items-center px-4">
          {Object.keys(steps).map((stepKey, index) => {
            const step = stepKey as Step;
            const StepIcon = STEP_CONFIG[step].icon;
            const isActive = currentStep === step;
            const isComplete = steps[step] < currentStepNumber;
            const isLast = index === Object.keys(steps).length - 1;
            
            return (
              <div key={step} className="flex items-center flex-1">
                <div className="w-full">
                  <div className="flex items-center">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0",
                      isActive && "border-primary bg-primary text-primary-foreground",
                      isComplete && "border-primary bg-primary text-primary-foreground",
                      !isActive && !isComplete && "border-muted-foreground/30 bg-background text-muted-foreground"
                    )}>
                      {isComplete ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    {!isLast && (
                      <div className={cn(
                        "h-[2px] flex-1 mx-2 transition-all",
                        isComplete ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="flex items-start justify-between gap-4">
            <div>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
            <Button variant="ghost" size="icon" aria-label="Dismiss error" onClick={() => setError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {/* Step 1: Project Overview */}
          {currentStep === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mobile App Redesign"
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{title.length}/200 characters</p>
                </div>

                <div>
                  <Label htmlFor="summary">Short Summary *</Label>
                  <Textarea
                    id="summary"
                    value={shortSummary}
                    onChange={(e) => setShortSummary(e.target.value)}
                    placeholder="A brief overview that will appear in project listings..."
                    rows={3}
                    className="mt-2"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{shortSummary.length}/200 characters</p>
                </div>

                <div>
                  <Label>Project Type * (Select 1-3)</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Choose from suggested categories or add your own
                  </p>
                  
                  {/* Suggested Types - Pill Style */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {PROJECT_TYPE_OPTIONS.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleProjectType(type)}
                        className={cn(
                          'px-4 py-2 rounded-full border text-sm transition-all',
                          'hover:border-foreground hover:bg-accent/50',
                          projectTypes.includes(type) && 'border-primary bg-primary text-primary-foreground hover:text-primary',
                          projectTypes.length >= 3 && !projectTypes.includes(type) && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={projectTypes.length >= 3 && !projectTypes.includes(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Custom Type Input */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="custom-type">Add Custom Type</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-type"
                        value={customProjectTypeInput}
                        onChange={(e) => setCustomProjectTypeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomProjectType();
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
                    <p className="text-xs text-muted-foreground">
                      2-30 characters, letters, numbers, spaces, hyphens, and &/ allowed
                    </p>
                  </div>

                  {/* Selected Types Display */}
                  <div className="p-4 rounded-lg border bg-muted/50 space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Selected Types ({projectTypes.length}/3)</Label>
                    </div>
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
            </motion.div>
          )}

          {/* Step 2: The Details */}
          {currentStep === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={detailedDescription}
                    onChange={(e) => setDetailedDescription(e.target.value)}
                    placeholder="Provide a comprehensive overview of the project goals, context, and expectations..."
                    rows={8}
                    className="mt-2"
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{detailedDescription.length}/2000 characters</p>
                </div>

                <div>
                  <Label htmlFor="deliverables">Expected Deliverables *</Label>
                  <Textarea
                    id="deliverables"
                    value={deliverables}
                    onChange={(e) => setDeliverables(e.target.value)}
                    placeholder="List the specific outputs students should produce (e.g., wireframes, prototype, research report...)"
                    rows={6}
                    className="mt-2"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{deliverables.length}/1000 characters</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Team Dynamics & Access */}
          {currentStep === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-10"
            >
              {/* Access Type Selection - Clean & Minimal */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-lg font-semibold">Project Type</Label>
                  <p className="text-sm text-muted-foreground">
                    How will students participate?
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Open Project */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccessType('OPEN');
                      setUnlimitedTeams(true);
                      setMaxTeams(null);
                    }}
                    className={cn(
                      'relative p-5 rounded-lg border text-left transition-all',
                      'hover:border-foreground',
                      accessType === 'OPEN' && 'border-foreground bg-accent'
                    )}
                  >
                    {ACCESS_TYPE_LABELS.OPEN.recommended && (
                      <Badge className="absolute -top-2 right-4 text-xs">Recommended</Badge>
                    )}
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="font-semibold">{ACCESS_TYPE_LABELS.OPEN.title}</div>
                        <p className="text-sm text-muted-foreground">
                          {ACCESS_TYPE_LABELS.OPEN.description}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Closed Project */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccessType('CLOSED');
                      setUnlimitedTeams(false);
                      setMaxTeams(3); // Default to 3 for closed projects
                      setMaxTeamsInput('3');
                    }}
                    className={cn(
                      'relative p-5 rounded-lg border text-left transition-all',
                      'hover:border-foreground',
                      accessType === 'CLOSED' && 'border-foreground bg-accent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="space-y-1">
                        <div className="font-semibold">{ACCESS_TYPE_LABELS.CLOSED.title}</div>
                        <p className="text-sm text-muted-foreground">
                          {ACCESS_TYPE_LABELS.CLOSED.description}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <Separator />

              {/* Team Size */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <Label className="text-lg font-semibold">Team Size</Label>
                  <p className="text-sm text-muted-foreground">Students per team</p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* Minimum Students */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Minimum</Label>
                      <Input
                        data-testid="min-students-input"
                        type="number"
                        inputMode="numeric"
                        value={minStudentsInput}
                        onChange={(e) => handleMinStudentsInputChange(e.target.value)}
                        onBlur={() => {
                          if (minStudentsInput === '') setMinStudentsInput(String(minStudents[0]));
                        }}
                        className="w-20 h-9 text-center tabular-nums"
                        min={1}
                      />
                    </div>
                    <div className="px-1">
                      <Slider
                        data-testid="min-students-slider"
                        value={[Math.min(minStudents[0], studentsSliderMax)]}
                        onValueChange={handleMinStudentsSliderChange}
                        min={1}
                        max={studentsSliderMax}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Maximum Students */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Maximum</Label>
                      <Input
                        data-testid="max-students-input"
                        type="number"
                        inputMode="numeric"
                        value={maxStudentsInput}
                        onChange={(e) => handleMaxStudentsInputChange(e.target.value)}
                        onBlur={() => {
                          if (maxStudentsInput === '') setMaxStudentsInput(String(maxStudents[0]));
                        }}
                        className="w-20 h-9 text-center tabular-nums"
                        min={1}
                      />
                    </div>
                    <div className="px-1">
                      <Slider
                        data-testid="max-students-slider"
                        value={[Math.min(maxStudents[0], studentsSliderMax)]}
                        onValueChange={handleMaxStudentsSliderChange}
                        min={1}
                        max={studentsSliderMax}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Number of Teams */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-lg font-semibold">Number of Teams</Label>
                    <p className="text-sm text-muted-foreground">
                      How many teams can participate?
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={unlimitedTeams}
                      onCheckedChange={(checked) => {
                        setUnlimitedTeams(checked);
                        if (!checked && maxTeams === null) {
                          setMaxTeams(3);
                          setMaxTeamsInput('3');
                        }
                      }}
                      id="unlimited-teams"
                    />
                    <Label htmlFor="unlimited-teams" className="text-sm cursor-pointer flex items-center gap-1.5">
                      Unlimited
                    </Label>
                  </div>
                </div>

                {!unlimitedTeams && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 pt-4"
                  >
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Maximum Teams</Label>
                      <Input
                        data-testid="max-teams-input"
                        type="number"
                        inputMode="numeric"
                        value={maxTeamsInput}
                        onChange={(e) => handleMaxTeamsInputChange(e.target.value)}
                        onBlur={() => {
                          if (maxTeamsInput === '' && maxTeams !== null) setMaxTeamsInput(String(maxTeams));
                        }}
                        className="w-20 h-9 text-center tabular-nums"
                        min={1}
                      />
                    </div>
                    <div className="px-1">
                      <Slider
                        data-testid="max-teams-slider"
                        value={maxTeams ? [Math.min(maxTeams, teamsSliderMax)] : [3]}
                        onValueChange={handleMaxTeamsSliderChange}
                        min={1}
                        max={teamsSliderMax}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <Separator />

              {/* Weekly Time Commitment */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <Label className="text-lg font-semibold">Time Commitment</Label>
                  <p className="text-sm text-muted-foreground">
                    Expected hours per week
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Hours per week</Label>
                    <div className="text-sm tabular-nums">
                      {weeklyHours[0]} hrs
                    </div>
                  </div>
                  <Slider
                    value={[weeklyHours[0]]}
                    onValueChange={(vals) => setWeeklyHours([Math.max(1, Math.min(40, Math.round(vals[0] || 1)))])}
                    min={1}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                    <span>40</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Skills & Collaboration */}
          {currentStep === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div>
                  <Label>Required Skills * (Select 1-10)</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Choose from suggested skills or add your own
                  </p>
                  
                  {/* Suggested Skills - Pill Style */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SUGGESTED_SKILLS.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'px-4 py-2 rounded-full border text-sm transition-all',
                          'hover:border-foreground hover:bg-accent/50',
                          skillsNeeded.includes(skill) && 'border-primary bg-primary text-primary-foreground hover:text-primary',
                          skillsNeeded.length >= 10 && !skillsNeeded.includes(skill) && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={skillsNeeded.length >= 10 && !skillsNeeded.includes(skill)}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>

                  {/* Custom Skill Input */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="custom-skill">Add Custom Skill</Label>
                    <div className="flex gap-2">
                      <Input
                        id="custom-skill"
                        value={customSkillInput}
                        onChange={(e) => setCustomSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomSkill();
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
                    <p className="text-xs text-muted-foreground">
                      2-30 characters, letters, numbers, spaces, and hyphens only
                    </p>
                  </div>

                  {/* Selected Skills Display - Below Custom Input */}
                  <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Selected Skills ({skillsNeeded.length}/10)</Label>
                    </div>
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

                <div>
                  <Label>Collaboration Style *</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    How will teams work together?
                  </p>
                  <RadioGroup value={collaborationStyle} onValueChange={setCollaborationStyle}>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'Remote', icon: Monitor },
                        { value: 'Hybrid', icon: Home },
                        { value: 'In-person', icon: Building },
                      ].map(({ value, icon: Icon }) => (
                        <label
                          key={value}
                          className={cn(
                            'relative p-4 rounded-lg border text-sm transition-all flex items-center gap-2 justify-center cursor-pointer',
                            'hover:border-foreground',
                            collaborationStyle === value && 'border-foreground bg-accent'
                          )}
                        >
                          <RadioGroupItem value={value} id={`collab-${value}`} className="sr-only" />
                          <Icon className="h-4 w-4" />
                          {value}
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
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

                <div>
                  <Label>Mentorship</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Will you provide guidance?
                  </p>
                  <RadioGroup value={mentorship} onValueChange={setMentorship}>
                    <div className="space-y-3">
                      {MENTORSHIP_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                            'hover:border-foreground',
                            mentorship === option && 'border-foreground bg-accent'
                          )}
                        >
                          <RadioGroupItem value={option} id={`mentorship-${option}`} className="mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-medium">{MENTORSHIP_LABELS[option as keyof typeof MENTORSHIP_LABELS].title}</div>
                            <p className="text-sm text-muted-foreground">
                              {MENTORSHIP_LABELS[option as keyof typeof MENTORSHIP_LABELS].description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Timeline & Resources */}
          {currentStep === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
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
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const d = new Date(date);
                            d.setHours(0, 0, 0, 0);
                            // must be future (today or later) and not after endDate if set
                            if (d < today) return true;
                            if (endDate) {
                              const e = new Date(endDate);
                              e.setHours(0, 0, 0, 0);
                              if (d > e) return true;
                            }
                            return false;
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
                            'w-full justify-start text-left font-normal',
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
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const d = new Date(date);
                            d.setHours(0, 0, 0, 0);
                            // must be future and not before startDate if set
                            if (d < today) return true;
                            if (startDate) {
                              const s = new Date(startDate);
                              s.setHours(0, 0, 0, 0);
                              if (d < s) return true;
                            }
                            return false;
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Duration hidden per request */}

                <div>
                  <Label htmlFor="resource-files">Resource Files (Optional)</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Upload files that will help students understand the project
                  </p>
                  <div className="space-y-3">
                    <label
                      htmlFor="resource-files"
                      className="flex items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:border-foreground transition-colors"
                    >
                      <Upload className="h-5 w-5" />
                      <span className="text-sm font-medium">Click to upload files</span>
                      <input
                        id="resource-files"
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {resourceFiles.length > 0 && (
                      <div className="space-y-2">
                        {resourceFiles.map((file, index) => (
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
                              onClick={() => removeFile(index)}
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
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Contact & Confidentiality */}
          {currentStep === 'contact' && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Contact Person *</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="contact-is-myself"
                        checked={contactIsMyself}
                        onCheckedChange={setContactIsMyself}
                      />
                      <Label htmlFor="contact-is-myself" className="text-sm font-normal cursor-pointer">
                        Contact is myself
                      </Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Full name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      disabled={contactIsMyself}
                      maxLength={100}
                    />
                    <Input
                      placeholder="Role/Title"
                      value={contactRole}
                      onChange={(e) => setContactRole(e.target.value)}
                      disabled={contactIsMyself}
                      maxLength={100}
                    />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={contactIsMyself}
                  />
                </div>

                <div>
                  <Label>Confidentiality *</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">
                    How should project details be shared?
                  </p>
                  <RadioGroup value={confidentiality} onValueChange={setConfidentiality}>
                    <div className="space-y-3">
                      {CONFIDENTIALITY_OPTIONS.map((option) => (
                        <label
                          key={option}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                            'hover:border-foreground',
                            confidentiality === option && 'border-foreground bg-accent'
                          )}
                        >
                          <RadioGroupItem value={option} id={`conf-${option}`} className="mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-medium">
                              {CONFIDENTIALITY_LABELS[option as keyof typeof CONFIDENTIALITY_LABELS].title}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {CONFIDENTIALITY_LABELS[option as keyof typeof CONFIDENTIALITY_LABELS].description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="internal-notes">Internal Notes (Optional)</Label>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Notes visible only to your team
                  </p>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add any internal notes or reminders..."
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 'overview' || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep !== 'contact' ? (
            <Button onClick={handleNext} disabled={!canProceed() || loading}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handleSubmit('INCOMPLETE', undefined, 'draft')}
                disabled={!canProceed() || loading}
              >
                {actionLoading === 'draft' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Draft
              </Button>
              <div className="inline-flex items-center">
                <Button
                  onClick={() => handleSubmit('ACCEPTING', undefined, 'publish')}
                  disabled={!canProceed() || loading}
                  className="rounded-r-none"
                >
                  {actionLoading === 'publish' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Publish
                </Button>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="px-2 border-l rounded-l-none"
                      aria-label="Schedule opening"
                    >
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isPopoverOpen && "rotate-180")} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="space-y-3" align="end">
                    <div className="text-sm font-medium">Schedule</div>
                    {startDate && (
                      <p className="text-xs text-muted-foreground">
                        Must be at most one day before start date ({startDate.toLocaleDateString()})
                      </p>
                    )}
                    <div>
                      <Calendar
                        mode="single"
                        selected={openDate}
                        onSelect={setOpenDate}
                        defaultMonth={openDate ?? new Date()}
                        startMonth={new Date(currentYear, 0, 1)}
                        endMonth={new Date(currentYear + 4, 11, 1)}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const dateToCheck = new Date(date);
                          dateToCheck.setHours(0, 0, 0, 0);
                          
                          // Disable dates before today
                          if (dateToCheck < today) return true;
                          
                          // Disable dates after (start_date - 1 day) if start_date is set
                          if (startDate) {
                            const maxDate = new Date(startDate);
                            maxDate.setDate(maxDate.getDate() - 1); // One day before start_date
                            maxDate.setHours(0, 0, 0, 0);
                            if (dateToCheck > maxDate) return true;
                          }
                          
                          return false;
                        }}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSubmit('SCHEDULED', openDate, 'schedule')}
                        disabled={!canProceed() || !openDate || loading}
                      >
                        {actionLoading === 'schedule' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Schedule
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
