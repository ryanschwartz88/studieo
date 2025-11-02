# **Studieo Master Design Doc**

Version: 1.0

Contact: Ryan Schwartz

Last Updated: October 31, 2025

## **1\. Project Overview**

### **1.1. Mission**

Studieo is a two-sided marketplace connecting vetted, high-performing students from top-tier universities with companies for real-world, project-based work.

* **For Companies:** A pipeline to high-potential talent for flexible, short-term projects.  
* **For Students:** A way to gain tangible, real-world experience, build their portfolios, and connect with potential employers.

### **1.2. Core Principles**

* **Exclusivity & Quality:** Both sides are vetted. Students must have a valid .edu email from a curated list. Companies must have a valid work email and are manually vetted by the Studieo admin team.  
* **Simplicity:** The platform should be intuitive and "just work." The UI should be clean, modern, and fast.  
* **Action-Oriented:** The goal is to move from project posting to team formation as frictionlessly as possible.

## **2\. User Roles & Personas**

1. **Student:**  
   * **Who:** An undergraduate or graduate student at a supported university (e.g., @stanford.edu).  
   * **Goal:** Find meaningful projects to build their resume, apply their skills, and potentially find a job.  
   * **Limitations:** Can be on a maximum of 3 "active" (applied or in-progress) projects at any time.  
2. **Company User:**  
   * **Who:** A manager, recruiter, or team lead at a company.  
   * **Goal:** Post a project, find a smart, capable team of students to complete it, and manage the application process.  
   * **Auth:** Is automatically associated with their Company based on their email domain (e.g., user@google.com joins the "Google" company profile).  
3. **Studieo Admin (Internal):**  
   * **Who:** The Studieo founding team.  
   * **Goal:** Manually vet and update company profiles, manage the curated list of universities, and monitor platform health.

## **3\. Recommended Tech Stack**

* **Framework:** **Next.js (App Router)**. Use Server Actions for mutations.  
* **Backend & DB:** **Supabase**. Provides Auth, Database, and Storage in one platform.  
* **Auth:** **Supabase Auth**. Will use Postgres Functions to implement custom domain-based validation.  
* **File Storage:** **Supabase Storage**. For student resumes and project-related file uploads (e.g., design docs).  
* **UI Components:** **Shadcn/UI**. A set of reusable, accessible, and easily themeable components.  
* **Email:** **Resend**. For all transactional emails (invites, notifications, etc.).

## **4\. Core Platform Features**

This section outlines the complete functionality of the platform.

### **4.1. Auth & Onboarding**

1. **Student Auth:**  
   * User signs up with an email.  
   * **Check:** Does the email domain match the curated list of .edu domains?  
   * If no, show an error: "Sorry, we're not at your school yet."  
   * If yes, send confirmation email. On success, redirect to Student Onboarding.  
2. **Student Onboarding:**  
   * A multi-step form to create their StudentProfile.  
   * **Fields:** name, gradDate, resume (file upload), interests/tags (for matching), description (short bio).  
3. **Company Auth:**  
   * User signs up with an email.  
   * **Check 1:** Is the domain a generic provider (gmail.com, hotmail.com, etc.)? If yes, show error: "Please use a valid work email."  
   * **Check 2:** Does a Company with this domain (e.g., acme.com) already exist?  
     1. If **yes**, link this new User to the existing Company. Redirect to the company dashboard.  
     2. If **no**, proceed to Company Onboarding.  
4. **Company Onboarding (Manual Vetting Flow):**  
   * A minimal form to reduce friction.  
   * **Fields:** name, role (at the company), sector  
   * **Backend:**  
     1. Creates a new Company record with name (from user) and domain (from email). All other fields (description) are NULL.  
     2. Links the new User to this new Company.  
     3. **Triggers Admin Email (via Resend) to admin@studieo.com**: "New Company Signup: \[Company Name\] (\[domain\]). Please vet and update their profile."  
   * **Admin Action:** The admin team logs into the Supabase dashboard, finds the new Company, and manually fills in the sector, website, and description to ensure quality.

### **4.2. Company Dashboard**

* **Layout:** A "ChatGPT-style" layout with a main content area and a collapsible sidebar.  
* **Sidebar:**  
  * "Add New Project" button at the top.  
  * A list of all Projects associated with the user's Company.  
  * Projects are grouped by ProjectStatus (e.g., Open, In Progress, Completed).  
* **Main View (Default):**  
  * A dashboard showing high-level stats: "Total Open Projects," "Pending Applications," "Total Applicants."  
* **Add/Edit Project Page (/company/projects/new):**  
  * A comprehensive, multi-step form to capture all project details (title, summary, description, type, tags, deliverables, skills, contact info, time range, team size, collaboration style, etc.).  
  * Can be saved as a draft (status: INCOMPLETE) or "Published" (status: OPEN).

### **4.3. Student Dashboard & Project Browsing**

* **Layout:** Similar sidebar layout to the company dashboard.  
* **Sidebar:**  
  * Lists projects the student is involved in.  
  * Grouped by "My Active Projects" (status ACCEPTED or IN\_PROGRESS) and "My Applications" (status SUBMITTED).  
* **Main View (Default): Browse Projects (/browse)**  
  * The primary discovery page for students.  
  * Includes a search bar and filters (Project Type, Skills Needed, Company Sector).  
  * Projects are displayed as cards with key info (title, company, summary, team size).  
* **Project Page (Student View):**  
  * A read-only view of the full project details.  
  * Displays all public information, including description, deliverables, and skills.  
  * A prominent "Apply" button.

### **4.4. Application & Team Management (Student Flow)**

1. **Start Application:** A student (the "Team Lead") clicks "Apply" on a Project Page.  
   * This creates a new Application record with status: 'PENDING'.  
   * The Team Lead is automatically added as a TeamMember.  
2. **Application Page (/applications/\[id\]):**  
   * The Team Lead is redirected here to build their application.  
   * **Upload Design Doc:** A required file-upload field.  
   * **Optional Questions:** Text areas for any questions the company added (if any).  
   * **Invite Team:** An input to invite other students by their .edu email.  
     * Inviting a student sends them a Resend email and creates a TeamMember record with inviteStatus: 'PENDING'.  
   * **Team List:** Shows all invited members and their inviteStatus (Pending, Accepted).  
   * Invited students see the invite on their dashboard and can "Accept" or "Decline."  
3. **Submit Application:**  
   * The Team Lead can submit the application at any time (even with pending invites).  
   * On submit, the Application status changes to SUBMITTED.  
   * This triggers a notification to the company.

### **4.5. Project & Applicant Management (Company Flow)**

* **Project Page (Company View): (/company/projects/\[id\])**  
  * This page has two tabs:  
  * **Tab 1: Project Info:** An editable form to update the project's details (e.g., fix a typo, add a resource link).  
  * **Tab 2: Applicants:**  
    * A list of all Applications with status: 'SUBMITTED'.  
    * Each item shows the Team Lead, team size, and submission date.  
    * Clicking an application opens a modal or new view to see the full details:  
      * List of all team members (and their profiles/resumes).  
      * A link to download their "Design Doc."  
      * Answers to optional questions.  
    * "Accept" and "Reject" buttons are present.  
    * Clicking "Accept" changes the Application status to ACCEPTED and notifies the student team. (This also fills one of the project's "available team slots").

### **4.6. Settings & Profile Management**

* **Trigger:** A "Settings" or "Profile" button located at the bottom of the main sidebar for both user types.  
* **User Profile Modal (for all users):**  
  * **Student:** Can edit all StudentProfile fields (name, gradDate, resume, interests, description).  
  * **Company User:** Can edit their name and role.  
* **Company Settings Modal (Company users only):**  
  * Allows company members to edit their shared Company profile.  
  * **Fields:** name, website, description. (This is editable by them *after* the admin's initial manual vetting).  
  * Also shows a read-only list of all Users associated with their company domain.

### **4.7. System-Wide Notifications (via Resend)**

1. **To Students:**  
   * team.invite: "Ryan invited you to join a team for Project X."  
   * application.accepted: "Your team was accepted for Project X\! Here is the contact info..."  
   * application.rejected: "An update on your application for Project X."  
2. **To Company Users:**  
   * project.new\_application: "You have a new application for Project X."  
3. **To Studieo Admins:**  
   * admin.new\_company: "New Company Signup: \[Company Name\]. Please vet their profile."

