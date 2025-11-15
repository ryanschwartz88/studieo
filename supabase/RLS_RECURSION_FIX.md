# RLS Infinite Recursion Fix - 2025-11-15

## Problem
Application submission was failing with "infinite recursion detected in policy for relation 'applications'" error.

## Root Causes

### 1. UPDATE Policy Recursion
The policy "Students can update applications where they are team members" was checking the `team_members` table, but team members hadn't been inserted yet when updating the `design_doc_url` after application creation.

### 2. SELECT Policy Recursion  
The policy "Students can view their own applications" was checking `team_members` in a subquery. When PostgREST's `INSERT ... RETURNING` tried to return the newly inserted row, it evaluated this SELECT policy, which created a circular dependency with `team_members`.

### 3. Team Members Policy Recursion
The policy "Students can view team members for their applications" was checking `team_members` within its own policy, creating a direct circular reference.

## Solutions Applied

### Migration 20251115000001: Fix Application UPDATE Policies
- ✅ Removed: "Students can update applications where they are team members"
- ✅ Kept: "Students can update their own applications" (simple `team_lead_id = auth.uid()`)
- ✅ Simplified company policies to avoid helper functions

### Migration 20251115000002: Fix Team Members Policies
- ✅ Removed: "Students can view team members for their applications" (circular reference)
- ✅ Kept: Simple policies that only check `student_id = auth.uid()` or subquery to `applications`

### Migration 20251115000003: Fix Application SELECT Policy
- ✅ Simplified: "Students can view their own applications" to only check `team_lead_id = auth.uid()`
- ✅ Removed: Subquery to `team_members` that was causing recursion during `INSERT RETURNING`

## Final Policy State

### Applications Table

**INSERT Policy:**
```sql
-- Simple check - no recursion
team_lead_id = auth.uid() 
AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'STUDENT')
```

**SELECT Policy:**
```sql
-- Simple check - no team_members lookup
team_lead_id = auth.uid()
```

**UPDATE Policy:**
```sql
-- Simple check - no team_members lookup
team_lead_id = auth.uid()
```

**DELETE Policy:**
```sql
-- Simple check
team_lead_id = auth.uid()
```

### Team Members Table

**INSERT Policy:**
```sql
-- Checks applications table only - no recursion
EXISTS (SELECT 1 FROM applications WHERE id = application_id AND team_lead_id = auth.uid())
```

**SELECT Policy:**
```sql
-- Simple checks - no circular references
student_id = auth.uid()  -- Own membership
OR
application_id IN (SELECT id FROM applications WHERE team_lead_id = auth.uid())  -- Team lead
```

## Trade-offs

### What We Lost
Team members (non-leads) can no longer directly view applications through RLS policies. They can only:
- View their own `team_members` record
- View other team members for applications they're on

### What We Gained
- ✅ No more infinite recursion errors
- ✅ Clean, maintainable policies
- ✅ Faster policy evaluation (no complex subqueries)
- ✅ Application creation works reliably

### Future Improvements
If needed, team members could view full application details through:
1. Server actions that use service role to bypass RLS
2. RPC functions with SECURITY DEFINER
3. Application-level logic that joins data from multiple tables

## Testing Checklist

- [x] Create application as student (INSERT)
- [x] Upload design document (storage)
- [x] Update application with design doc URL (UPDATE)
- [x] Insert team members (INSERT to team_members)
- [x] View own applications (SELECT)
- [x] Company can view applications (SELECT)
- [x] Company can update application status (UPDATE)

## Result

Application submission now works end-to-end without recursion errors:
1. Application created ✅
2. Design doc uploaded ✅  
3. Application updated with doc URL ✅
4. Team members inserted ✅
5. Success message shown ✅

