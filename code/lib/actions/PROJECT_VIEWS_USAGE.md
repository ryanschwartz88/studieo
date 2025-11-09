# Project Views Implementation Guide

## Overview

The project view tracking system uses a **hybrid approach** that gives you both performance and detailed analytics:

1. **`project_views` table**: Tracks individual views (who, what, when)
2. **`view_count` field on `projects`**: Cached counter for fast display
3. **`record_project_view()` function**: Handles both updates automatically

## Features

✅ **Unique view tracking**: Only counts one view per user per project  
✅ **Fast queries**: Display view counts without JOIN operations  
✅ **Detailed analytics**: Track timestamps, user behavior, trending projects  
✅ **Privacy controls**: RLS policies restrict view data access  
✅ **Automatic updates**: Counter syncs with detailed tracking table  

## Usage

### 1. Recording a Project View

Call this when a user views a project details page or modal:

```typescript
import { recordProjectView } from '@/lib/actions/projects';

// In your project detail page or modal component
useEffect(() => {
  const trackView = async () => {
    const result = await recordProjectView(projectId);
    if (result.success) {
      console.log(`View count: ${result.viewCount}`);
      console.log(`New view: ${result.isNewView}`); // false if user already viewed
    }
  };
  trackView();
}, [projectId]);
```

### 2. Displaying View Counts

The `view_count` field is automatically included in all project queries:

```typescript
// Projects already include view_count
const { data: projects } = await supabase
  .from('projects')
  .select('*, view_count')
  .eq('status', 'ACCEPTING');

// Or use the search_projects function (view_count is included)
const { data } = await supabase.rpc('search_projects', {
  search_query: 'design',
  project_status_filter: 'ACCEPTING'
});
// data[0].view_count is available
```

### 3. Getting Recently Viewed Projects

Show users their recently viewed projects (e.g., in dashboard):

```typescript
import { getRecentlyViewedProjects } from '@/lib/actions/projects';

export default async function DashboardPage() {
  const result = await getRecentlyViewedProjects(10); // limit to 10
  
  if (result.success) {
    const recentProjects = result.projects;
    // Each project includes: project_id, project_title, company_name, 
    // company_logo_url, viewed_at, project_status
  }
}
```

### 4. Trending Projects (Analytics)

Query the `trending_projects` view for admin analytics:

```typescript
const { data: trending } = await supabase
  .from('trending_projects')
  .select('*')
  .order('views_last_7_days', { ascending: false })
  .limit(10);

// Each row includes:
// - view_count (total unique views)
// - views_last_7_days
// - views_last_24_hours
// - company_name, title, status, etc.
```

## Implementation Locations

### When to Call `recordProjectView()`

1. **Project Modal Opens** (Browse page)
   - File: `code/app/(student)/browse/_components/ProjectModal.tsx` or similar
   - Trigger: When modal opens with project details
   
2. **Project Detail Page** (Dedicated page)
   - File: `code/app/(student)/projects/[id]/page.tsx` or similar
   - Trigger: On page load (useEffect)

3. **Company View** (Their own projects)
   - Optional: Track when company users view their own projects for analytics

### Example: In a Project Modal

```typescript
'use client';

import { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { recordProjectView } from '@/lib/actions/projects';

export function ProjectModal({ project, open, onClose }) {
  // Track view when modal opens
  useEffect(() => {
    if (open && project?.id) {
      recordProjectView(project.id).catch(console.error);
    }
  }, [open, project?.id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <h2>{project.title}</h2>
        <p className="text-sm text-muted-foreground">
          {project.view_count} views
        </p>
        {/* Rest of project details */}
      </DialogContent>
    </Dialog>
  );
}
```

## Database Schema

### `project_views` Table

```sql
CREATE TABLE project_views (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects(id),
  user_id uuid REFERENCES users(id),
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id) -- Prevents duplicate views
);
```

### `projects.view_count` Field

```sql
ALTER TABLE projects ADD COLUMN view_count integer DEFAULT 0;
```

## RLS Policies

- **Students**: Can see view counts for `ACCEPTING` projects
- **Companies**: Can see detailed view analytics for their own projects
- **All users**: Can see their own view history

## Performance Notes

- **View count queries**: O(1) lookup, no JOINs needed
- **Recording views**: Uses `ON CONFLICT` for efficient upserts
- **Trending queries**: Indexed on `viewed_at` for fast time-based filtering

## Future Enhancements

Potential features to add:

1. **Sort by popularity**: Add "Most Viewed" sort option in browse page
2. **View-based recommendations**: Suggest similar projects based on view patterns
3. **Company analytics dashboard**: Show view trends over time
4. **A/B testing**: Test different project descriptions and track view-to-apply conversion
5. **Anonymous views**: Currently requires authentication, could track IP-based views for non-logged-in users

