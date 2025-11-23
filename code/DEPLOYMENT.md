# Deployment Guide for Studieo

This guide outlines the steps to deploy the Studieo application to Vercel, including the integration with the Framer landing page.

## Prerequisites

-   **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
-   **Vercel Account**: You need a Vercel account linked to your GitHub.
-   **Supabase Project**: You need your Supabase project URL and keys.
-   **Resend API Key**: You need your Resend API key for emails.

## 1. Configure Vercel Project

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `studieo` repository.

## 2. Environment Variables

In the "Configure Project" screen, add the following environment variables. You can find these in your `.env.local` file or your Supabase/Resend dashboards.

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon Key | `eyJhbG...` |
| `RESEND_API_KEY` | Your Resend API Key | `re_123...` |
| `NEXT_PUBLIC_URL` | The URL of your Vercel deployment | `https://studieo.vercel.app` (or your custom domain) |

> **Note:** For `NEXT_PUBLIC_URL`, initially you can use the Vercel-generated domain (e.g., `studieo.vercel.app`). If you add a custom domain later, update this variable.

## 3. Deploy

1.  Click **"Deploy"**.
2.  Vercel will build and deploy your application. This usually takes a minute or two.

## 4. Verify Deployment

### Landing Page (Unauthenticated)
1.  Open a **private/incognito** browser window.
2.  Visit your deployment URL (e.g., `https://studieo.vercel.app`).
3.  **Expected Result**: You should see your Framer landing page (`studieo.com`). The URL in the browser bar should remain `studieo.vercel.app`.

### Dashboard (Authenticated)
1.  In a normal browser window, visit your deployment URL.
2.  Log in with a test account.
3.  **Expected Result**: You should be redirected to `/student/dashboard` or `/company/dashboard`.

## Troubleshooting

-   **Landing page not showing?**
    -   Check if you are logged in. The landing page only shows for unauthenticated users.
    -   Verify the `middleware.ts` file has the correct rewrite logic.
-   **Redirect loops?**
    -   Ensure your `NEXT_PUBLIC_URL` matches your deployment domain.
