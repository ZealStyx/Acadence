# Acadence

**A clearer view of every academic week.**

Acadence is an academic workload planner for students, instructors, and administrators. It brings recorded section deadlines and, separately, coursework from a user's Google Classroom connection into weekly views. Instructors can check a section's existing workload before adding a deadline; administrators can inspect eligible section workloads.

> **Current scope:** Some instructor and administrator screens are restricted to a specifically marked seeded batch. This is not yet a general-purpose production deployment. See [Current limitations](#current-limitations) before using the app with real data.

## Contents

- [What the app does](#what-the-app-does)
- [How workload is calculated](#how-workload-is-calculated)
- [Technology and repository structure](#technology-and-repository-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Accounts and access](#accounts-and-access)
- [Google Classroom and AI](#google-classroom-and-ai)
- [Development and verification](#development-and-verification)
- [Deployment](#deployment)
- [Current limitations](#current-limitations)
- [Further documentation](#further-documentation)

## What the app does

- **Students:** View their primary section's recorded workload, browse weeks and deadlines, and connect Google Classroom to see their own published coursework—including undated work in Timeline. Personal Classroom items and their optional AI estimates are displayed separately from the shared section score.
- **Instructors:** Review assigned section workloads, manage recorded deadlines, and check projected collisions and alternative dates before saving. A separate Classroom connection supports coursework review and category suggestions.
- **Administrators:** Manage accounts, academic sections, course offerings, and primary section memberships. The section heatmap summarizes eligible sections; sections with fewer than five active students are excluded.
- **Accessibility:** The workspace includes dark mode, larger-text and reduced-motion preferences, keyboard-accessible controls, status labels, and mobile layouts.

Acadence supports planning, not automatic rescheduling. Its views are only as complete as the data entered or successfully retrieved.

## How workload is calculated

A **primary academic section** is a cohort for a term. Course offerings belong to that section, and recorded assessments from those offerings form the same shared weekly workload for its members. Weeks start on Monday.

The shared score is the sum of each recorded assessment's type weight multiplied by `1 + grade weight / 100`:

| Recorded type | Type weight |
| --- | ---: |
| Quiz | 1 |
| Activity | 2 |
| Exam | 3 |
| Existing performance record | 4 |

For example, a quiz worth 10% contributes `1 × 1.10 = 1.1` points. Weekly bands are **Light** below 6, **Heavy** from 6 to below 10, and **Critical** from 10. The implementation is in [`calculations.ts`](apps/web/convex/calculations.ts).

Personal Classroom estimates are **not** shared scores. When available, the app uses AI-predicted categories for dated work, with quiz/activity/exam worth 1/2/3 points and no grade-weight adjustment. The estimates can be wrong; unclassified or unavailable coursework yields an unavailable estimate rather than a fabricated zero. Work without a due date is not placed in a weekly score. Shared section scores do not automatically include personal Classroom work.

## Technology and repository structure

- **Web app:** Next.js App Router, React, TypeScript, and CSS.
- **Authentication:** Firebase Authentication with Google Sign-In; Convex verifies Firebase JWTs and authorizes application roles.
- **Data and functions:** Convex queries, mutations, and schema.
- **Optional integrations:** Read-only Google Classroom OAuth and Gemini-assisted categorization/guidance.
- **Tests:** Vitest and `convex-test`.

```text
apps/web/
  convex/                 Schema, authorization, queries and mutations
  src/app/                Next.js entry, styles and API routes
  src/components/         Workspace and role-specific UI
  src/hooks/ and src/lib/ Client hooks, helpers and server integrations
  tests/                  Unit, component and Convex tests
  public/                 Logo and local fonts
  .env.example            Public frontend configuration template
  ACADENCE_SETUP.md       Integration and deployment notes
docs/                     Design, integration and dataset documentation
```

The active workspace is [`Workspace.tsx`](apps/web/src/components/Workspace.tsx). The repository also contains older components and backend modules; their presence does not mean they are active routes.

## Getting started

### Prerequisites

- Node.js and npm. The project was checked with Node.js 22 and npm 10.
- A Convex project and development deployment.
- A Firebase project with a Web app and Google Sign-In enabled. Authorize `localhost` and any deployed domain in Firebase Authentication.
- Optional: Google Cloud OAuth credentials and Classroom API access for Classroom features; a Gemini API key for AI features.

### Install and configure

1. Install the web app dependencies:

   ```bash
   cd apps/web
   npm ci
   cp .env.example .env.local
   ```

2. In `apps/web/.env.local`, provide the Firebase Web app values and the URL of the intended Convex deployment. These `NEXT_PUBLIC_` values are browser-visible; do not put server secrets in this file under a public prefix.
3. Configure the same Firebase project ID as `FIREBASE_PROJECT_ID` **in the Convex deployment**, and configure `ACADENCE_BOOTSTRAP_ADMIN_EMAIL` there if a first administrator needs to be set up. The Firebase Web and Convex project IDs must match. Existing deployments may still use the legacy bootstrap variable; see the [setup guide](apps/web/ACADENCE_SETUP.md).
4. Configure/select the Convex development deployment and push the schema and functions:

   ```bash
   npx convex dev
   ```

   On first use, the CLI prompts you to select or create a project. If the initial push reports that `FIREBASE_PROJECT_ID` is missing, set it in that deployment's Convex dashboard and retry. Keep the watcher running while developing. Confirm that the deployment URL in `.env.local` is the one you configured.
5. In a second terminal, start the web app:

   ```bash
   cd apps/web
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign in with an authorized account; an administrator must assign students to primary sections for shared section workload to appear. Classroom is a separate optional connection.

The empty root `.env.example` is not the web app's configuration template. Do not commit `.env.local`, credentials, access tokens, or deployment keys.

## Environment variables

### Web app: public configuration

Set these in `apps/web/.env.local` for local development and in the web hosting environment for deployment. See [`apps/web/.env.example`](apps/web/.env.example).

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | Convex deployment used by the frontend and web API routes. |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID; must match Convex's `FIREBASE_PROJECT_ID`. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Web app ID. |

### Convex deployment

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Required to configure the Firebase JWT provider. |
| `ACADENCE_BOOTSTRAP_ADMIN_EMAIL` | First administrator's university email when bootstrapping; remove after use. |
| `CLASSROOM_SYNC_SECRET` | Shared server-to-Convex sync secret, at least 32 characters, matching the web server value when Classroom snapshot sync is used. |
| `PITCH_DEMO_ENABLED` | Defaults to disabled. Set to `true` only on an explicitly approved, isolated deployment when using the guarded seeded dataset. |

### Web server: optional integrations

These are server-only values, **not** `NEXT_PUBLIC_` variables:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLASSROOM_CLIENT_ID` / `GOOGLE_CLASSROOM_CLIENT_SECRET` | Google OAuth web-client credentials for the separate Classroom connection. |
| `CLASSROOM_REDIRECT_URI` | Exact authorized callback URL ending in `/api/classroom/callback`, on the same origin as the app; HTTPS except for localhost. |
| `CLASSROOM_ENCRYPTION_KEY` | Stable, base64-encoded 32-byte key for encrypted connection data. Losing or changing it makes saved connections unreadable. |
| `CLASSROOM_SYNC_SECRET` | At least 32 characters; must match the Convex deployment's value. |
| `GEMINI_API_KEY` | Enables server-side AI classification and bounded section guidance. |
| `GEMINI_CLASSIFICATION_MODEL` | Optional bare model ID; defaults to `gemini-3.5-flash-lite`. Availability depends on provider access and configuration. |
| `CONVEX_DEPLOY_KEY` | Sensitive deployment credential, only when the hosting build deploys Convex. |

Keep secrets in the appropriate deployment's secret settings. Never include them in screenshots, logs, chat, or Git. See the [setup guide](apps/web/ACADENCE_SETUP.md) for key generation, OAuth scopes, and operational details.

## Accounts and access

- New `@lspu.edu.ph` identities can register as students. The two explicitly configured Gmail administrator exceptions are in [`access.ts`](apps/web/convex/access.ts).
- Instructors are administrator-controlled. Administrators manage account roles, sections, offerings, and primary memberships; signing in alone does not assign a student to a section.
- Existing approved accounts can link to the matching Firebase identity; subsequent ownership uses the Firebase UID. A disabled or already-linked account cannot be silently replaced.
- **Security tradeoff:** The current sign-in policy does not require email verification, including for account linking and administrator exceptions. A domain suffix alone does not prove mailbox ownership. Restrict trusted Firebase providers, review account ownership and the [setup guide](apps/web/ACADENCE_SETUP.md) before using real data.

## Google Classroom and AI

Classroom authorization is separate from Firebase login. The user connects the same Google identity, grants read-only scopes, and can refresh or disconnect the connection. Refresh tokens are encrypted server-side and bound to the user's Firebase UID. Classroom access does not automatically establish a verified section mapping or change the shared section score.

The web server can send student assignment titles and Classroom work types to Gemini for personal category estimates; it does not send descriptions for that student estimate. Instructor review may send coursework descriptions as well. Section guidance uses authorized section facts and a bounded AI-selected strategy; its displayed numbers and dates come from application data. AI output is advisory. If the provider or configuration is unavailable, tasks remain visible where available and estimates can be unavailable; section guidance has a deterministic fallback.

Connections, snapshots, and live provider access need operational verification. A partial refresh is not proof that no coursework exists. Undated work and personal Classroom items do not silently become shared section deadlines.

## Development and verification

Run these from `apps/web`:

```bash
npm test         # Vitest suite, including mocked Convex tests
npm run build    # Next.js production build and type checking
npm run dev      # local development server
npm run start    # serve an existing production build
```

Tests use mock identities and provider responses; they do **not** verify live Firebase JWT signatures, Google OAuth consent and scopes, Classroom data, Gemini access, or responsive layouts on real devices. Before release, test those integrations with authorized accounts in the intended environment. Avoid using real student data in isolated test datasets.

## Deployment

Deploy the Convex schema/functions and the web application to matching environments. Set the public Firebase/Convex configuration and server-only secrets in the appropriate hosting environment, and configure `FIREBASE_PROJECT_ID` and any sync secret in the corresponding Convex deployment. Configure the exact Google OAuth callback and authorized domains before enabling Classroom. A frontend deployment and Convex deployment are separate operations unless your build explicitly deploys both; verify the target before deploying.

For Vercel/Convex examples, bootstrap migration, key handling, and operational troubleshooting, see [`apps/web/ACADENCE_SETUP.md`](apps/web/ACADENCE_SETUP.md). Review the current code and limitations below as well: that document contains historical implementation notes that may not describe the active screens.

## Current limitations

- The active instructor and administrator section dashboards depend on a marked seeded batch and filter several section/subject views to it; without that batch, staff views may say no section data exists or omit non-seeded records. Student primary-section queries do not have that filter. This restriction must be addressed before relying on those staff views for real sections.
- Admin section heatmaps suppress groups with fewer than five active students. Recorded data can be incomplete; a score is not a verified complete timetable.
- Classroom items may overlap manually entered deadlines; they are shown separately rather than automatically merged into shared scores. Provider outages, permissions, stale connections, and incomplete course loads affect coverage.
- AI-generated categories and advice are not authoritative. Category availability, model access, quota, and connectivity can affect estimates. No live integration or mobile-device verification is implied by unit tests.
- No syllabus upload or parsing workflow is exposed in the active workspace. Existing legacy modules and planning documents are not a feature checklist.

## Further documentation

- [Setup, security, and deployment notes](apps/web/ACADENCE_SETUP.md) — includes historical sections; check current implementation when details conflict.
- [Interface and design notes](apps/web/ACADENCE_DESIGN.md).
- [Google Classroom integration design](docs/google-classroom-integration.md) — design intent, not a guarantee of current functionality.
- [Firebase and Convex assessment](docs/firebase-convex-assessment.md).
- [Guarded seeded-data instructions](docs/pitch-demo-data.md) — use only in an authorized isolated environment; never create or reset data in a shared deployment without approval.
- [Project plan](docs/project-plan.md) — broader design goals and proposed features, not necessarily implemented.
