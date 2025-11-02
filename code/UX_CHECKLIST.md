# Studieo UI Review Checklist (Simplistic + Animated)

Use this before merging any UI change.

- Composition
  - [ ] Only shadcn/Animate/Aceternity components used (no custom primitives)
  - [ ] Composed inline in pages; extract only if reused 3+ times

- Layout
  - [ ] Centered vertical stack (auth) with `max-w-2xl`; app pages `max-w-6xl`
  - [ ] Generous whitespace: primary sections `space-y-6`
  - [ ] Inputs and buttons height `h-11`

- Motion
  - [ ] Subtle micro-animations on entry/hover (150–250ms, ease-out)
  - [ ] Respect `prefers-reduced-motion`

- Forms
  - [ ] shadcn `Form` + Zod + RHF for validation
  - [ ] Minimal copy; avoid long helper text
  - [ ] Inline errors use `Alert`; global feedback uses `sonner`

- Auth
  - [ ] Google button placed first; email/password second
  - [ ] Verification-first flow enforced; unverified users see `/auth/verify-email`
  - [ ] Logo top-centered using `public/Studieo Logo/Full Logo.svg`

- Onboarding
  - [ ] Step 0: Theme picker (Light/Dark)
  - [ ] Boxless content; centered `Calendar`; Back hidden on first step

- Accessibility & Tests
  - [ ] Keyboard/focus visible; color contrast meets WCAG AA
  - [ ] All interactive elements have `data-testid`

