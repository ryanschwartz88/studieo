'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { completeOnboarding, uploadResume } from '@/lib/actions/students';
import { INTEREST_OPTIONS } from '@/lib/schemas/auth';
import { Upload, CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/animate-ui/components/radix/progress';
import { FocusCards } from '@/components/ui/focus-cards';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FlipButton, FlipButtonFront, FlipButtonBack } from '@/components/animate-ui/primitives/buttons/flip';
import { AnimatePresence, motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

type Step = 'theme' | 'grad-date' | 'interests' | 'bio' | 'resume';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('theme');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [gradDate, setGradDate] = useState<Date | undefined>(undefined);
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [resume, setResume] = useState<File | null>(null);

  // Check if onboarding is already complete (e.g., completed in another tab)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('grad_date, interests, description')
        .eq('user_id', user.id)
        .single();
      
      // If onboarding is complete, redirect to search
      const isComplete = !!(
        profile?.grad_date && 
        profile?.interests?.length && 
        profile?.description
      );
      
      if (isComplete) {
        console.log('[ONBOARDING] Already complete, redirecting to search');
        router.replace('/student/search');
      }
    };
    
    // Check on mount
    checkOnboardingStatus();
    
    // Also check when page becomes visible (e.g., switching tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkOnboardingStatus();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const steps: Record<Step, number> = {
    'theme': 1,
    'grad-date': 2,
    'interests': 3,
    'bio': 4,
    'resume': 5,
  };

  const totalSteps = Object.keys(steps).length;
  const currentStepNumber = steps[currentStep];

  // Theme cards for focus cards component
  const themeCards = [
    {
      title: 'Light',
      src: '/images/light-theme.png',
    },
    {
      title: 'Dark',
      src: '/images/dark-theme.png',
    },
  ];

  function toggleInterest(interest: string) {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      if (interests.length < 10) {
        setInterests([...interests, interest]);
      }
    }
  }

  function canProceed() {
    switch (currentStep) {
      case 'theme':
        return true;
      case 'grad-date':
        return !!gradDate;
      case 'interests':
        return interests.length > 0;
      case 'bio':
        return bio.length <= 500;
      case 'resume':
        return true; // Resume is optional
      default:
        return false;
    }
  }

  function handleNext() {
    // Validate bio length if on bio step
    if (currentStep === 'bio' && bio.length < 50) {
      setError('Your bio must be at least 50 characters');
      return;
    }
    
    const stepOrder: Step[] = ['theme', 'grad-date', 'interests', 'bio', 'resume'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
      setError(null);
    }
  }

  function handleBack() {
    const stepOrder: Step[] = ['theme', 'grad-date', 'interests', 'bio', 'resume'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
      setError(null);
    }
  }

  function handleThemeSelection(index: number) {
    if (index === 0) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setTimeout(() => {
      setCurrentStep('grad-date');
    }, 300);
  }

  async function handleComplete() {
    if (!gradDate || interests.length === 0 || !bio) {
      setError('Please complete all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload resume first if provided
      if (resume) {
        const uploadResult = await uploadResume(resume);
        if (!uploadResult.success) {
          setError(uploadResult.error || 'Failed to upload resume');
          setLoading(false);
          return;
        }
      }

      // Complete onboarding
      const result = await completeOnboarding({
        grad_date: gradDate,
        interests,
        description: bio,
      });

      if (!result.success) {
        setError(result.error || 'Failed to complete onboarding');
      }
      // On success, completeOnboarding redirects automatically
    } catch (err: any) {
      // Check if this is a Next.js redirect (which is expected on success)
      // Next.js redirect throws an error with NEXT_REDIRECT in the digest
      if (err?.digest?.includes('NEXT_REDIRECT')) {
        throw err; // Re-throw to allow the redirect to happen
      }
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="mx-auto w-full max-w-2xl space-y-8 animate-in fade-in-50">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Complete your profile</h1>
          <Badge variant="secondary" className="text-xs rounded-full px-3 py-1">
            Step {currentStepNumber} of {totalSteps}
          </Badge>
        </div>
        
        <Progress value={(currentStepNumber / totalSteps) * 100} className="h-2" />

        <div className="min-h-[400px] space-y-6">
          {error && (
            <Alert variant="destructive" className="rounded-xl bg-red-50 border border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200">
              <AlertTitle>There was a problem</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            {/* Step 0: Theme Picker with Focus Cards */}
            {currentStep === 'theme' && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <Label className="text-xl font-semibold">Choose your style</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred theme
                  </p>
                </div>
                <FocusCards 
                  cards={themeCards} 
                  onCardClick={handleThemeSelection}
                  overlayColors={{
                    0: 'bg-white/40',  // Light theme gets lighter overlay
                    1: 'bg-black/50'   // Dark theme keeps dark overlay
                  }}
                  textColors={{
                    0: 'text-black',    // Light theme gets black text
                    1: 'text-white'     // Dark theme keeps white text
                  }}
                />
              </motion.div>
            )}

            {/* Step 1: Graduation Date */}
            {currentStep === 'grad-date' && (
              <motion.div
                key="grad-date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <Label className="text-xl font-semibold">When do you graduate?</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your expected graduation date
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="rounded-xl border p-4 inline-block">
                    <Calendar
                      mode="single"
                      selected={gradDate}
                      onSelect={setGradDate}
                      captionLayout='dropdown'
                      className="mx-auto"
                      data-testid="grad-date-calendar"
                      endMonth={new Date(new Date().getFullYear() + 4, 11, 31)}
                      startMonth={new Date(new Date().getFullYear(), 0, 1)}
                      fixedWeeks={true}
                    />
                  </div>
                </div>
                {gradDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 text-sm text-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>Graduation: {gradDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Interests */}
            {currentStep === 'interests' && (
              <motion.div
                key="interests"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <Label className="text-xl font-semibold">What interests you?</Label>
                  <p className="text-sm text-muted-foreground">
                    Select 1-10 areas you're passionate about ({interests.length}/10 selected)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={interests.includes(interest) ? 'default' : 'outline'}
                      className={`cursor-pointer px-4 py-2.5 text-sm rounded-xl transition-all ${
                        interests.includes(interest)
                          ? 'bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90'
                          : 'hover:border-foreground'
                      }`}
                      onClick={() => toggleInterest(interest)}
                      data-testid={`interest-${interest.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Bio */}
            {currentStep === 'bio' && (
              <motion.div
                key="bio"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-xl font-semibold">Tell us about yourself</Label>
                  <p className="text-sm text-muted-foreground">
                    Share your background, goals, and what you're looking for (50-500 characters)
                  </p>
                </div>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="I'm a computer science student passionate about AI and machine learning. I've worked on several research projects and I'm looking to apply my skills to real-world problems..."
                  className="min-h-[200px] resize-none rounded-xl"
                  maxLength={500}
                  data-testid="bio-input"
                />
                <div className="flex items-center justify-end text-sm">
                  <span className="text-muted-foreground">
                    {bio.length}/500
                  </span>
                </div>
              </motion.div>
            )}

            {/* Step 4: Resume Upload */}
            {currentStep === 'resume' && (
              <motion.div
                key="resume"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <Label className="text-xl font-semibold">Upload your resume (optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    PDF or Word document, max 5MB. You can skip this and add it later.
                  </p>
                </div>
                <div className="border-2 border-dashed rounded-xl p-12 text-center hover:border-foreground transition-colors">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files?.[0] || null)}
                    className="hidden"
                    data-testid="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-3">
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <p className="text-base font-medium">Click to upload resume</p>
                      <p className="text-sm text-muted-foreground">PDF, DOC, DOCX (max 5MB)</p>
                    </div>
                  </label>
                </div>
                {resume && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-foreground"
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    <span className="truncate font-medium">{resume.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setResume(null)}
                      className="ml-auto rounded-lg"
                    >
                      Remove
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between pt-4">
          {/* Hide Back on first step */}
          {currentStep !== 'theme' ? (
            <FlipButton
              onClick={handleBack}
              disabled={loading}
              data-testid="back-button"
              className="min-w-fit"
              from="top"
              tapScale={0.95}
            >
              <FlipButtonFront className="h-11 px-6 rounded-xl border border-border bg-background text-foreground">
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </span>
              </FlipButtonFront>
              <FlipButtonBack className="h-11 px-6 rounded-xl border border-border bg-accent text-accent-foreground">
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </span>
              </FlipButtonBack>
            </FlipButton>
          ) : <div />}

          {/* Hide Next on theme step */}
          {currentStep !== 'theme' && currentStep !== 'resume' && (
            <FlipButton
              onClick={handleNext}
              disabled={!canProceed() || loading}
              data-testid="next-button"
              className="min-w-fit"
              from="top"
              tapScale={0.95}
            >
              <FlipButtonFront className="h-11 px-6 rounded-xl border border-border bg-background text-foreground">
                <span className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </span>
              </FlipButtonFront>
              <FlipButtonBack className="h-11 px-6 rounded-xl border border-border bg-accent text-accent-foreground">
                <span className="flex items-center gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </span>
              </FlipButtonBack>
            </FlipButton>
          )}

          {currentStep === 'resume' && (
            <FlipButton
              onClick={handleComplete}
              disabled={loading || !canProceed()}
              data-testid="complete-button"
              className="min-w-fit"
              from="top"
              tapScale={0.95}
            >
              <FlipButtonFront className="h-11 px-6 rounded-xl bg-black text-white dark:bg-white dark:text-black">
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> 
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </FlipButtonFront>
              <FlipButtonBack className="h-11 px-6 rounded-xl bg-white text-black dark:bg-black dark:text-white border border-border">
                <span className="flex items-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> 
                      Completing…
                    </>
                  ) : (
                    <>
                      Submit
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </FlipButtonBack>
            </FlipButton>
          )}
        </div>
      </div>
    </div>
  );
}
