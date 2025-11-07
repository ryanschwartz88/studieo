# Studieo Component Library

**Last Updated**: November 3, 2025

This document serves as the single source of truth for all prebuilt UI components available in the Studieo project. Our design philosophy: **compose, don't create**. Every component in this library is from a trusted registry—no custom components unless absolutely necessary.

---

## Quick Reference

| Registry | Primary Use | Installation |
|----------|-------------|--------------|
| `@shadcn` | Core UI primitives, forms, layouts | `npx shadcn@latest add [component]` |
| `@animate-ui` | Animated buttons, transitions, effects | Already installed in codebase |
| `@cult-ui` | Advanced UI patterns | `npx shadcn@latest add @cult-ui/[component]` |
| `@aceternity` | Hero sections, animated blocks | Manual install + wrapper |
| `@blocks` | Layout blocks | `npx shadcn@latest add @blocks/[component]` |
| `@react-bits` | React patterns | `npx shadcn@latest add @react-bits/[component]` |
| `@algolia` | Search components | `npx shadcn@latest add @algolia/[component]` |

---

## Registry Breakdown

### 1. @shadcn (Primary Registry)

**Purpose**: Core UI primitives for forms, navigation, data display, and overlays.

**Style**: `new-york` with `slate` base color and CSS variables

**Location**: Auto-installed to `components/ui/`

#### Form Components

##### Input & Text
- **`input`** - Text input fields
  - Use for: Titles, names, emails, single-line text
  - Variants: Default (h-11)
  - Example: `<Input placeholder="Project title" />`

- **`textarea`** - Multi-line text input
  - Use for: Descriptions, bios, long-form content
  - Example: `<Textarea className="min-h-48" maxLength={500} />`

- **`label`** - Form field labels
  - Use for: All form fields for accessibility
  - Example: `<Label htmlFor="title">Project Title</Label>`

##### Selection Components
- **`checkbox`** - Boolean selection
  - Use for: Terms acceptance, feature toggles
  - Example: `<Checkbox id="terms" />`

- **`radio-group`** - Single choice from options
  - Use for: Mutually exclusive choices
  - Example: `<RadioGroup><RadioGroupItem value="yes" /></RadioGroup>`

- **`select`** - Dropdown selection
  - Use for: Long lists of options
  - Example: `<Select><SelectTrigger>Choose...</SelectTrigger></Select>`

- **`toggle-group`** - Multi or single selection with visual toggle
  - Use for: Visual multi-select (collaboration style, formats)
  - Variants: `outline`, `default`
  - Example: `<ToggleGroup type="multiple"><ToggleGroupItem value="remote">Remote</ToggleGroupItem></ToggleGroup>`

- **`switch`** - Boolean toggle
  - Use for: On/off settings
  - Example: `<Switch checked={value} onCheckedChange={setValue} />`

##### Slider & Range
- **`slider`** - Numeric range input
  - Use for: Numbers, ranges, percentages
  - Example: `<Slider defaultValue={[50]} max={100} step={1} />`

##### Date & Time
- **`calendar`** - Date picker
  - Modes: Single, multiple, range
  - Use for: Date selection with dropdown year/month
  - Example: `<Calendar mode="single" selected={date} onSelect={setDate} />`

- **`calendar-23`** (block) - **Date range picker in popover**
  - Use for: Start/end date selection
  - Includes: Popover trigger + Calendar with range mode
  - Perfect for: Project timelines

#### Layout & Navigation

- **`card`** - Content container
  - Use for: Grouped content, project cards, feature sections
  - Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - Example: `<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader></Card>`

- **`separator`** - Visual divider
  - Use for: Separating sections
  - Orientations: horizontal (default), vertical
  - Example: `<Separator className="my-6" />`

- **`sidebar`** - Navigation sidebar
  - Use for: App navigation, dashboards
  - Already installed and used in layouts

- **`tabs`** - Tabbed navigation
  - Use for: Switching between views
  - Example: `<Tabs><TabsList><TabsTrigger>Tab 1</TabsTrigger></TabsList></Tabs>`

- **`breadcrumb`** - Breadcrumb navigation
  - Use for: Page hierarchy
  - Already used in company dashboard

#### Overlays & Dialogs

- **`dialog`** - Modal dialog
  - Use for: Forms, confirmations, detailed views
  - Example: `<Dialog><DialogTrigger><Button>Open</Button></DialogTrigger></Dialog>`

- **`popover`** - Floating content
  - Use for: Additional info, tooltips, date pickers
  - Example: `<Popover><PopoverTrigger>Click</PopoverTrigger></Popover>`

- **`sheet`** - Slide-out panel
  - Use for: Mobile menus, side forms
  - Sides: top, right, bottom, left

- **`drawer`** - Bottom drawer
  - Use for: Mobile-friendly overlays
  - Example: `<Drawer><DrawerTrigger>Open</DrawerTrigger></Drawer>`

- **`tooltip`** - Hover tooltip
  - Use for: Help text, additional info
  - Example: `<Tooltip><TooltipTrigger>Hover</TooltipTrigger></Tooltip>`

- **`hover-card`** - Rich hover content
  - Use for: Profile previews, detailed info on hover

#### Feedback & Status

- **`alert`** - Alert messages
  - Variants: `default`, `destructive`
  - Use for: Errors, warnings, info messages
  - Example: `<Alert variant="destructive"><AlertTitle>Error</AlertTitle></Alert>`

- **`badge`** - Status badge or tag
  - Variants: `default`, `secondary`, `destructive`, `outline`
  - Use for: Tags, skills, status indicators
  - **Interactive pattern**: Make clickable for multi-select
  - Example: `<Badge variant={selected ? 'default' : 'outline'} onClick={toggle}>Design</Badge>`

- **`progress`** - Progress bar
  - Use for: Loading states, form progress
  - Example: `<Progress value={66} />`

- **`skeleton`** - Loading placeholder
  - Use for: Content loading states

- **`spinner`** - Loading indicator
  - Use for: Button loading states

- **`sonner`** - Toast notifications
  - Use for: Success/error feedback after actions
  - Example: `toast.success('Project created!')`

#### Buttons & Actions

- **`button`** - Standard button
  - Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
  - Sizes: `default`, `sm`, `lg`, `icon`
  - Example: `<Button variant="outline">Cancel</Button>`

- **`button-group`** - Grouped buttons
  - Use for: Related actions (Draft/Schedule/Publish)
  - Example: `<ButtonGroup><Button>Save</Button><Button>Publish</Button></ButtonGroup>`

#### Data Display

- **`table`** - Data table
  - Use for: Tabular data, applications list
  - Sub-components: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`

- **`avatar`** - User avatar
  - Use for: User images with fallback

#### Premium Field Components ⭐

These are examples that showcase best practices for form field composition:

- **`field`** - Field wrapper component
  - Use for: Consistent field layouts
  - Sub-components: `Field`, `FieldTitle`, `FieldDescription`, `FieldContent`
  - Provides proper spacing, labels, descriptions

- **`field-choice-card`** - **Card-based radio selection**
  - Use for: Important single choices with descriptions
  - Perfect for: Mentorship preference, confidentiality level
  - Each option gets a full card with icon + title + description
  - Example use: Confidentiality (Public/Confidential/NDA Required)

- **`field-slider`** - **Slider with live inline value display**
  - Use for: Numeric inputs where seeing the value is important
  - Shows current value in description text
  - Perfect for: Team size, hours, ranges
  - Example: "Set your budget range ($200 - $800)"

- **`field-input`**, **`field-textarea`**, **`field-select`**, etc.
  - Consistent field patterns for all input types

---

### 2. @animate-ui (Animation Library)

**Purpose**: Animated primitives and effects for delightful interactions

**Location**: `components/animate-ui/`

**Already Installed**:

#### Buttons
- **`FlipButton`** - Button with flip animation on hover
  - Components: `FlipButton`, `FlipButtonFront`, `FlipButtonBack`
  - Props: `from` (top/bottom/left/right), `tapScale`
  - Use for: ALL navigation buttons (Back/Next/Submit)
  - Example:
    ```tsx
    <FlipButton from="top" tapScale={0.95}>
      <FlipButtonFront className="h-11 px-6 bg-primary">Next</FlipButtonFront>
      <FlipButtonBack className="h-11 px-6 bg-accent">Next</FlipButtonBack>
    </FlipButton>
    ```

- **`LiquidButton`** - Button with liquid effect
  - Use for: Special call-to-action buttons

#### Progress & Feedback
- **`Progress`** - Animated progress bar with spring transitions
  - Better than shadcn progress for smooth animations
  - Use for: Multi-step form progress
  - Example: `<Progress value={percentage} className="h-2" />`

#### Effects
- **`AutoHeight`** - Smooth height transitions
  - Use for: Expanding/collapsing sections

- **`Highlight`** - Highlight text effect
  - Use for: Drawing attention to key text

#### Primitives
- **`Tabs`** (animated) - Tabs with smooth transitions
  - Enhanced version of shadcn tabs

- **`Switch`** (animated) - Switch with smooth toggle animation

---

### 3. @aceternity (Coming Soon - Not Yet Configured)

**Purpose**: Hero sections, advanced animations, animated backgrounds

**Status**: Registry URL added to components.json, components not yet installed

**Potential Components**:
- Expandable Card
- Bento Grid
- Hero sections
- Timeline components
- Animated backgrounds
- Spotlight effects

**Note**: When needed, install manually and create wrappers in `components/blocks/`

---

### 4. @cult-ui (Recently Added - Not Yet Explored)

**Purpose**: Advanced UI patterns and components

**Status**: Registry URL added to components.json

**Note**: Explore when building advanced features

---

### 5. Other Registries

**@blocks**, **@react-bits**, **@algolia** - Available but not yet explored

---

## Component Selection Decision Tree

```
Need a component?
│
├─ Is it a form input?
│  ├─ Single line text → `input`
│  ├─ Multi-line text → `textarea`
│  ├─ Number/range → `slider` or `field-slider`
│  ├─ Date → `calendar` or `calendar-23` (range)
│  ├─ Single choice → `radio-group` or `field-choice-card`
│  ├─ Multi-choice → `checkbox` or `toggle-group`
│  └─ Dropdown → `select`
│
├─ Is it for navigation?
│  ├─ Primary action → `button` (default)
│  ├─ Multiple related actions → `button-group`
│  ├─ With animation → `FlipButton`
│  ├─ Sidebar → `sidebar`
│  └─ Tabs → `tabs`
│
├─ Is it for feedback?
│  ├─ Error/warning → `alert`
│  ├─ Success toast → `sonner`
│  ├─ Progress → `Progress` (animate-ui)
│  ├─ Loading → `spinner` or `skeleton`
│  └─ Status → `badge`
│
├─ Is it for layout?
│  ├─ Container → `card`
│  ├─ Divider → `separator`
│  └─ Overlay → `dialog`, `sheet`, `drawer`, or `popover`
│
└─ Is it for data display?
   ├─ Table → `table`
   ├─ User avatar → `avatar`
   └─ Interactive tags → `badge` (clickable)
```

---

## Common Patterns

### Pattern 1: Multi-Select with Badges (Interests/Skills)

**Used in**: Onboarding (interests), Project Form (skills)

```tsx
const [selected, setSelected] = useState<string[]>([]);

<div className="flex flex-wrap gap-2">
  {OPTIONS.map((option) => (
    <Badge
      key={option}
      variant={selected.includes(option) ? 'default' : 'outline'}
      className="cursor-pointer px-4 py-2.5 transition-all hover:scale-105"
      onClick={() => {
        setSelected(prev => 
          prev.includes(option) 
            ? prev.filter(i => i !== option)
            : [...prev, option]
        )
      }}
    >
      {option}
    </Badge>
  ))}
</div>
```

### Pattern 2: FocusCards for Visual Selection

**Used in**: Onboarding (theme), Project Form (project type)

```tsx
import { FocusCards } from '@/components/ui/focus-cards';

const cards = [
  { title: 'Option 1', src: '/images/option1.png' },
  { title: 'Option 2', src: '/images/option2.png' },
];

<FocusCards 
  cards={cards} 
  onCardClick={(index) => setSelected(cards[index].title)}
/>
```

### Pattern 3: Field with Live Value Display

**Used in**: Project Form (team size, hours)

```tsx
'use client';
import { useState } from 'react';
import { Field, FieldTitle, FieldDescription } from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';

const [value, setValue] = useState([5]);

<Field>
  <FieldTitle>Team Size</FieldTitle>
  <FieldDescription>
    Teams of <span className="font-medium">{value[0]}</span> students
  </FieldDescription>
  <Slider value={value} onValueChange={setValue} min={1} max={10} />
</Field>
```

### Pattern 4: FlipButton Navigation

**Used in**: All multi-step forms

```tsx
import { FlipButton, FlipButtonFront, FlipButtonBack } from '@/components/animate-ui/primitives/buttons/flip';
import { ArrowRight } from 'lucide-react';

<FlipButton from="top" tapScale={0.95} onClick={handleNext}>
  <FlipButtonFront className="h-11 px-6 rounded-xl bg-primary text-primary-foreground">
    <span className="flex items-center gap-2">
      Next <ArrowRight className="h-4 w-4" />
    </span>
  </FlipButtonFront>
  <FlipButtonBack className="h-11 px-6 rounded-xl bg-accent text-accent-foreground">
    <span className="flex items-center gap-2">
      Next <ArrowRight className="h-4 w-4" />
    </span>
  </FlipButtonBack>
</FlipButton>
```

### Pattern 5: Animated Step Transitions

**Used in**: All multi-step forms

```tsx
import { AnimatePresence, motion } from 'framer-motion';

<AnimatePresence mode="wait">
  {currentStep === 'step1' && (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Step content */}
    </motion.div>
  )}
</AnimatePresence>
```

### Pattern 6: Character Counter with Color Transition

**Used in**: Onboarding (bio), Project Form (descriptions)

```tsx
const [text, setText] = useState('');
const maxLength = 500;
const progress = text.length / maxLength;

<Textarea 
  value={text}
  onChange={(e) => setText(e.target.value)}
  maxLength={maxLength}
/>
<div className="flex justify-end">
  <span className={cn(
    "text-sm transition-colors",
    progress < 0.5 ? "text-muted-foreground" : 
    progress < 0.9 ? "text-primary" : "text-destructive"
  )}>
    {text.length}/{maxLength}
  </span>
</div>
```

---

## Animation Standards

### Timing Values

- **Fast interactions**: 150-200ms (hover, focus)
- **Standard transitions**: 250-300ms (step changes, reveals)
- **Slow animations**: 400-500ms (page transitions)

### Easing Functions

- **Default**: `ease-out` - Most transitions
- **Spring**: For natural motion (sliders, draggable)
  - `{ type: 'spring', stiffness: 280, damping: 20 }`
- **Ease-in-out**: For symmetric animations

### Common Animation Properties

```tsx
// Standard fade + slide
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -20 }}
transition={{ duration: 0.3, ease: 'easeOut' }}

// Scale on hover
whileHover={{ scale: 1.02 }}
transition={{ duration: 0.2 }}

// Spring animation
animate={{ scale: 1 }}
transition={{ type: 'spring', stiffness: 280, damping: 20 }}

// Staggered children
variants={{
  container: {
    animate: { transition: { staggerChildren: 0.05 } }
  },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 }
  }
}}
```

### Accessibility

Always respect user preferences:

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

transition={{ 
  duration: prefersReducedMotion ? 0 : 0.3 
}}
```

---

## Installation Guide

### Installing shadcn Components

```bash
# Single component
npx shadcn@latest add button

# Multiple components
npx shadcn@latest add button input textarea badge

# Specific examples
npx shadcn@latest add field-choice-card field-slider

# Blocks
npx shadcn@latest add calendar-23
```

### Already Installed Components

Check `components/ui/` for installed primitives:
- alert, avatar, badge, breadcrumb, button, calendar, card, checkbox
- collapsible, dialog, dropdown-menu, focus-cards, form, hover-card
- input, label, popover, progress, radio-group, select, separator
- sheet, sidebar, skeleton, sonner, switch, table, tabs, textarea, tooltip

Check `components/animate-ui/` for animation components:
- FlipButton, LiquidButton, Progress, Tabs, Switch
- AutoHeight, Highlight, Slot

---

## Best Practices

### DO ✅

1. **Always search registries first** before building custom components
2. **Compose components inline** in page files—avoid unnecessary abstraction
3. **Use Field components** for consistent form layouts
4. **Add data-testid** to all interactive elements for testing
5. **Use FlipButton** for all primary navigation actions
6. **Respect animation preferences** with `prefers-reduced-motion`
7. **Follow the 5x rule**: Only extract if you use the same composition 5+ times

### DON'T ❌

1. **Don't create custom components** unless truly necessary
2. **Don't skip Field wrappers** for form inputs (inconsistent UX)
3. **Don't use inline styles** (use Tailwind classes)
4. **Don't animate expensive properties** (width, height—use scale/opacity)
5. **Don't forget accessibility** (ARIA labels, keyboard navigation)
6. **Don't hardcode animations** (use standard timing values)

---

## When to Extract a Component

Only create a custom component file if:

1. **Used 5+ times** with identical composition
2. **Complex internal state** that's self-contained
3. **Third-party integration** needs a stable wrapper
4. **Registry component is unstable** and needs API normalization

Otherwise: **Compose directly in pages**.

---

## Future Additions

As we explore more registries, add sections here for:
- @cult-ui patterns
- @aceternity blocks  
- @blocks layouts
- @react-bits patterns
- @algolia search components

---

## Questions?

- Check `code/AGENTS.md` for project-level guidance
- Check `code/components/AGENTS.md` for component philosophy
- Check this file for component-specific decisions

**Remember**: Compose, don't create. 🎨

