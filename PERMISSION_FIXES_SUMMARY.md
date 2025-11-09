# Permission Fixes - View Tracking & Edit Access

## 🔒 Security Issues Fixed

### 1. View-to-Apply Rate Now Only Counts Student Views ✅

**Problem:** Companies viewing their own projects were being counted in the view statistics, inflating view counts and skewing the view-to-apply conversion rate.

**Solution:** Modified `recordProjectView()` to check user role before tracking:

```typescript
// Check user role - only track student views
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

// Only track views from students (not companies)
if (!userData || userData.role !== 'STUDENT') {
  return { 
    success: true, 
    isNewView: false,
    viewCount: 0,
    message: 'View not tracked (company user)'
  };
}
```

**Result:** 
- ✅ Only student views are tracked
- ✅ View-to-Apply Rate is now accurate (student views → applications)
- ✅ Companies can still view their projects without affecting metrics

---

### 2. Project Editing Restricted to Creator Only ✅

**Problem:** ANY company user could edit ANY project from their company, not just the projects they created. This allowed unauthorized modifications.

**Solution:** Added `created_by_id` checks to all update functions:

#### `updateProjectFull()` - Full project updates
```typescript
// Verify project belongs to user AND was created by user
const { data: proj } = await supabase
  .from('projects')
  .select('id, company_id, created_by_id, status, start_date')
  .eq('id', projectId)
  .single();

// Only the creator can edit the project
if (proj.created_by_id !== user.id) {
  return { success: false, error: 'Only the project creator can edit this project' };
}
```

#### `updateProjectFields()` - Inline field updates
```typescript
// Verify project belongs to same company AND user created it
const { data: proj } = await supabase
  .from('projects')
  .select('company_id, created_by_id')
  .eq('id', projectId)
  .single();

// Only the creator can edit the project
if (proj.created_by_id !== user.id) {
  return { success: false, error: 'Only the project creator can edit this project' };
}
```

#### UI: Edit Button Only Shown to Creator
```typescript
// Check if current user is the creator
const isCreator = project.created_by_id === user.id

// Only show edit button if user created this project
{isCreator && (
  <ProjectEditToolbar project={project} />
)}
```

**Result:**
- ✅ Only project creators can edit their projects
- ✅ Other company users can view but not modify
- ✅ Edit button hidden for non-creators
- ✅ Server-side validation prevents API bypass attempts

---

## 🔐 Security Layers

### Backend (Server Actions)
1. **Authentication Check**: Verify user is logged in
2. **Role Check**: Ensure user has correct role (COMPANY)
3. **Company Check**: Verify project belongs to user's company
4. **Creator Check**: Verify user created the project ⭐ NEW

### Frontend (UI)
1. **Conditional Rendering**: Hide edit buttons for non-creators
2. **Visual Feedback**: Clear indication of who can edit

### Database (RLS)
- Existing RLS policies enforce company-level access
- New checks add creator-level granularity

---

## 📊 Updated Metrics Accuracy

### Before Fix:
```
Total Views: 500 (includes 300 company views + 200 student views)
Applications: 10
View-to-Apply Rate: 10/500 = 2.0%
```

### After Fix:
```
Total Views: 200 (only student views)
Applications: 10
View-to-Apply Rate: 10/200 = 5.0% ✅ Accurate!
```

The conversion rate is now much more meaningful for companies to optimize their project descriptions.

---

## 🛡️ Functions Already Had Correct Permissions

These functions were already checking `created_by_id`:
- ✅ `updateProjectStatus()` - Status changes (draft → open, etc.)
- ✅ `deleteProject()` - Project deletion
- ✅ `uploadResourceFiles()` - File uploads

---

## 📁 Files Modified

### Server Actions
- `code/lib/actions/projects.ts`
  - Updated `recordProjectView()` to filter by role
  - Updated `updateProjectFull()` to check creator
  - Updated `updateProjectFields()` to check creator

### UI Components
- `code/app/(company)/projects/[id]/page.tsx`
  - Added `created_by_id` to type and query
  - Added `isCreator` check
  - Conditionally render edit button

---

## ✨ Business Impact

### For Companies:
1. **Accurate Metrics**: View-to-Apply Rate reflects real student interest
2. **Project Security**: Only creators can edit their projects
3. **Team Collaboration**: Other company members can view all projects
4. **Better Optimization**: Accurate data drives better project descriptions

### For Students:
1. **Consistent Experience**: No confusing edits from multiple company users
2. **Clear Ownership**: Projects have a single owner/point of contact

### For Platform:
1. **Data Integrity**: Metrics are trustworthy
2. **Audit Trail**: Clear ownership and edit history
3. **Compliance**: Proper access controls in place

---

## 🔍 Testing Checklist

To verify these fixes:

### View Tracking
- [ ] Log in as a company user
- [ ] View your own project
- [ ] Check dashboard - view count should NOT increase
- [ ] Log in as a student user  
- [ ] View the same project
- [ ] Check company dashboard - view count SHOULD increase

### Edit Permissions
- [ ] Company User A creates a project
- [ ] Company User B (same company) views the project
- [ ] User B should see project details but NO edit button
- [ ] User B tries to edit via API (use browser console)
- [ ] Should receive error: "Only the project creator can edit this project"
- [ ] User A can still edit successfully

---

## 🎯 Summary

Both security issues have been resolved:

1. **View Tracking**: ✅ Only tracks student views (not company self-views)
2. **Edit Access**: ✅ Only project creator can edit (not all company users)

The platform now has proper access controls and accurate engagement metrics! 🔒

