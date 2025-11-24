# Deployment Guide for Studieo (Hybrid Setup)

This guide outlines the steps to deploy the Studieo application to Vercel, configured to serve your Framer site for marketing pages while hosting the app on the same domain.

## Prerequisites

-   **GitHub Repository**: Ensure your code is pushed to a GitHub repository.
-   **Vercel Account**: You need a Vercel account linked to your GitHub.
-   **Framer Origin URL**: The URL of your published Framer site (e.g., `https://my-project.framer.website`).

## 1. Configure Vercel Project

1.  Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `studieo` repository.

## 2. Environment Variables

In the "Configure Project" screen (or later in Settings -> Environment Variables), add the following:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Anon Key | `eyJhbG...` |
| `RESEND_API_KEY` | Your Resend API Key | `re_123...` |
| `NEXT_PUBLIC_URL` | The main domain of your app | `https://studieo.com` |
| `FRAMER_URL` | **CRITICAL**: The origin URL of your Framer site | `https://studieo.framer.website` |

> **Important**: Do NOT set `FRAMER_URL` to `studieo.com`. It must be the underlying Framer URL (e.g., `*.framer.website`) to avoid infinite loops.

## 3. Deploy

1.  Click **"Deploy"**.
2.  Wait for the build to complete.

## 4. DNS Configuration

1.  In Vercel, go to **Settings -> Domains**.
2.  Add `studieo.com`.
3.  Follow Vercel's instructions to update your DNS records (usually an A record pointing to `76.76.21.21`).

## 5. Verify Hybrid Routing

-   **Marketing Pages**: Visit `studieo.com` or `studieo.com/about`.
    -   *Expected*: You should see your Framer content, but the URL remains `studieo.com`.
-   **App Pages**: Visit `studieo.com/auth/login` or `studieo.com/student/dashboard`.
    -   *Expected*: You should see the Next.js application.

## Troubleshooting

-   **Infinite Redirect Loop**: Check that `FRAMER_URL` is NOT set to `studieo.com`.
-   **404 on Marketing Pages**: Verify the `FRAMER_URL` is correct and the page exists on Framer.
-   **App Pages showing Framer 404**: Ensure the route is included in the `isAppRoute` check in `middleware.ts`.
