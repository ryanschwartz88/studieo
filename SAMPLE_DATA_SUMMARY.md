# Sample Data Created ✅

## Summary

Successfully created comprehensive sample data for development and testing:

- **11 Companies** (10 new + 1 existing Nura)
- **15 Active Projects** (status: ACCEPTING)
- **16 Project Views** (student views only)
- **View counts updated** on all projects

---

## 🏢 New Companies Created

### Technology Sector
1. **Acme AI** (acmeai.com) - San Francisco, CA
   - AI research company building ML tools
   
2. **CloudScale Systems** (cloudscale.io) - Seattle, WA
   - Enterprise cloud infrastructure provider
   
3. **DataViz Analytics** (dataviz.com) - New York, NY
   - Data visualization and analytics platform

### Healthcare Sector
4. **MedTech Innovations** (medtech.io) - Boston, MA
   - Healthcare technology startup
   
5. **HealthFlow** (healthflow.com) - Austin, TX
   - Digital health platform

### Finance Sector
6. **FinTech Solutions** (fintechsolutions.com) - Chicago, IL
   - Financial technology company
   
7. **CryptoVault** (cryptovault.io) - San Francisco, CA
   - Blockchain and cryptocurrency security

### Education Sector
8. **EduTech Labs** (edutechlabs.com) - Cambridge, MA
   - Educational technology company

### Sustainability Sector
9. **GreenTech Energy** (greentech.energy) - Portland, OR
   - Renewable energy solutions
   
10. **EcoSolutions** (ecosolutions.io) - Boulder, CO
    - Environmental consulting firm

---

## 📋 Projects Created

Each company has **1 project** with realistic details:

### Technology Projects
- **Acme AI**: AI-Powered Customer Support Chatbot
- **CloudScale Systems**: Cloud Infrastructure Monitoring Dashboard
- **DataViz Analytics**: Interactive Data Visualization Library

### Healthcare Projects
- **MedTech Innovations**: Patient Health Monitoring Mobile App
- **HealthFlow**: Telemedicine Platform Enhancement

### Finance Projects
- **FinTech Solutions**: Fraud Detection System
- **CryptoVault**: Blockchain Transaction Analyzer

### Education Projects
- **EduTech Labs**: Adaptive Learning Platform

### Sustainability Projects
- **GreenTech Energy**: Solar Energy Optimization System
- **EcoSolutions**: Carbon Footprint Calculator

### Project Details
- **Status**: All set to `ACCEPTING`
- **Access Type**: Mostly `OPEN` (one `CLOSED` for MedTech)
- **Team Size**: 2-4 students
- **Weekly Hours**: 10-20 hours
- **Collaboration**: Mostly `Remote`
- **Mentorship**: All set to `YES`
- **Confidentiality**: Mostly `PUBLIC`

---

## 👥 Existing Users

### Company User
- **ryan.schwartz@nuralabs.io** (COMPANY)
  - Created all new projects (as `created_by_id`)
  - Can edit all projects they created

### Student User
- **ryanschwartz@berkeley.edu** (STUDENT)
  - Used to generate project views
  - Views are tracked in `project_views` table

---

## 📊 View Tracking Data

- **16 total views** across projects
- **View counts updated** on all projects
- **Only student views** are counted (company views excluded)
- Views distributed across different projects

---

## 🔍 How to Use This Data

### For Testing Browse Page
1. Navigate to `/browse`
2. You should see **15+ projects** from various companies
3. Test sorting by:
   - **Most Viewed** - See projects with view counts
   - **Earliest Deadline** - Projects sorted by end date
   - **Relevance** - When searching
   - **Last Updated** - Default sort

### For Testing Dashboard
1. Log in as company user (`ryan.schwartz@nuralabs.io`)
2. Navigate to `/dashboard`
3. You should see:
   - **View-to-Apply Rate** (calculated from views/applications)
   - **Active Projects** count
   - **Total Views** across all projects

### For Testing Project Pages
1. Navigate to any project detail page
2. View counts should be visible
3. Edit button only shows if you're the creator

### For Testing View Tracking
1. Log in as student user
2. View projects - views should be tracked
3. Log in as company user
4. View your own projects - views should NOT be tracked

---

## 📝 Next Steps (Optional)

### Add More Student Users
To test with multiple students, create auth users via Supabase Auth:
1. Go to Supabase Dashboard → Authentication → Users
2. Create new users with `.edu` email addresses
3. Create corresponding `public.users` records with `role = 'STUDENT'`
4. Create `student_profiles` for each

### Add Applications
To test the full flow:
1. Log in as student
2. Browse projects
3. Create applications via the UI
4. View-to-Apply Rate will update automatically

### Add Company Users
To test multi-user companies:
1. Create auth users with company email domains
2. Link them to existing companies via `company_id`
3. They can view projects but only creators can edit

---

## 🗄️ Database Queries

### View All Companies
```sql
SELECT id, name, domain, sector, location 
FROM companies 
ORDER BY name;
```

### View All Active Projects
```sql
SELECT 
  p.title,
  c.name as company_name,
  p.status,
  p.view_count,
  p.min_students,
  p.max_students
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE p.status = 'ACCEPTING'
ORDER BY p.view_count DESC;
```

### View Project Views
```sql
SELECT 
  p.title,
  COUNT(pv.id) as view_count,
  MAX(pv.viewed_at) as last_viewed
FROM projects p
LEFT JOIN project_views pv ON p.id = pv.project_id
GROUP BY p.id, p.title
ORDER BY view_count DESC;
```

### View-to-Apply Rate by Company
```sql
SELECT 
  c.name,
  SUM(p.view_count) as total_views,
  COUNT(a.id) as total_applications,
  CASE 
    WHEN SUM(p.view_count) > 0 
    THEN ROUND((COUNT(a.id)::numeric / SUM(p.view_count)::numeric) * 100, 2)
    ELSE 0 
  END as view_to_apply_rate
FROM companies c
LEFT JOIN projects p ON c.id = p.company_id
LEFT JOIN applications a ON p.id = a.project_id
GROUP BY c.id, c.name
ORDER BY total_views DESC;
```

---

## ✅ Data Integrity

- ✅ All foreign keys valid
- ✅ All required fields populated
- ✅ View counts match actual views
- ✅ Only student views counted
- ✅ Projects linked to valid companies
- ✅ Projects created by valid users

---

## 🧹 Cleanup (If Needed)

To remove all sample data:

```sql
-- Remove views
DELETE FROM project_views WHERE project_id IN (
  SELECT id FROM projects WHERE company_id IN (
    SELECT id FROM companies WHERE domain IN (
      'acmeai.com', 'cloudscale.io', 'dataviz.com', 'medtech.io', 
      'healthflow.com', 'fintechsolutions.com', 'cryptovault.io', 
      'edutechlabs.com', 'greentech.energy', 'ecosolutions.io'
    )
  )
);

-- Remove projects
DELETE FROM projects WHERE company_id IN (
  SELECT id FROM companies WHERE domain IN (
    'acmeai.com', 'cloudscale.io', 'dataviz.com', 'medtech.io', 
    'healthflow.com', 'fintechsolutions.com', 'cryptovault.io', 
    'edutechlabs.com', 'greentech.energy', 'ecosolutions.io'
  )
);

-- Remove companies
DELETE FROM companies WHERE domain IN (
  'acmeai.com', 'cloudscale.io', 'dataviz.com', 'medtech.io', 
  'healthflow.com', 'fintechsolutions.com', 'cryptovault.io', 
  'edutechlabs.com', 'greentech.energy', 'ecosolutions.io'
);
```

---

## 📁 Files

- **`supabase/seed_sample_data.sql`** - Complete seed script (for reference)
- **`SAMPLE_DATA_SUMMARY.md`** - This file

---

**All sample data is ready to use!** 🎉

You can now test the full application with realistic data across multiple companies, projects, and view tracking.

