# Persistent pitch dataset

This is synthetic sample data in Convex, **not** Google Classroom. The existing Firebase sign-in and real OAuth flow are unchanged. Use a dedicated development/pitch Convex deployment, not production; seed/reset write to whichever deployment the web app uses. The admin page displays its `NEXT_PUBLIC_CONVEX_URL`. Verify it against the Convex dashboard. Do not put real credentials or secrets in the dataset.

## Setup and accounts

1. Configure the existing Firebase and Convex integration as described in `apps/web/PULSO_SETUP.md`. Deploy the current Convex schema/functions and web app to the same intended environment. Example from `apps/web`: `npx convex dev` for the configured development deployment. A production deployment requires the appropriate separate deployment procedure; do not assume the example targets production.
2. In the **target Convex deployment's** environment settings, set `PITCH_DEMO_ENABLED=true`. It defaults to disabled; no public `NEXT_PUBLIC_` flag controls access. Turn it back off after the pitch. The authenticated, active Pulso administrator must sign in with their existing Firebase account.
3. In Accounts, provision one real team account as an active instructor (and have that person link/sign in through the existing process). Optionally sign in as or provision an active student team account. Use an account with **no primary section**; the seed refuses to move a student from another section. No role, name, email or Firebase UID is changed by the seed. Synthetic roster accounts have `@demo.invalid` addresses, no Firebase UID and cannot sign in.

## Preview and seed

1. Admin → **Pitch Demo Data**. Confirm the target Convex URL is the dedicated pitch deployment. Enter the existing instructor email and optional student email. Optionally specify a Monday; otherwise the server calculates the current UTC Monday on the first run.
2. Select **Preview and validate**, review the expected counts and any account error, then type `SEED_ACADENCE_PITCH_DEMO` and select **Generate / Resume**. Provision the instructor in Accounts if validation fails.
3. Seeding is one atomic Convex mutation; it either commits fully or rolls back, so there is no partial batch to resume. Repeating it with the same accounts reports the existing batch without duplicates and keeps its original reference Monday. To change the chosen accounts or reference week, reset and seed again. Section code/term or synthetic email collisions fail rather than overwrite existing records. Do not seed automatically on login or reload.
4. After reload, use **Switch to pitch section views**. This preference is local to the browser; the data itself is persisted in Convex. Switch back to the live Classroom views at any time.

## Manifest

Batch `acadence-pitch-demo-v1`, term `1st Semester AY 2026–2027`; nine sections and 160 roster members. BSPsych 1A, BSBA-FM 2B, BSCrim 2B, BSCpE 2A, BSIT-AD 3A, BSHM 2A, BSEd 2A, and MAEd 1A each have 16 members. BSInfoTech-WMAD 3A has 32. An optional real student occupies one showcase slot, leaving 159 synthetic students; otherwise there are 160. Eight synthetic instructors own the other sections; the selected real instructor owns four showcase offerings. There are 36 course offerings and 154 assessments across eight weeks. No snapshots, reviews, Classroom connections or tokens are generated. Course names, subject/code combinations, and assessment names are illustrative, not verified curricula. GSAR uses explicitly fictional `DEMO GSAR` labels rather than asserting graduate course codes. The LSPU web pages supplied with the request could not be independently accessed from this environment; program acronyms are based on the user-provided taxonomy.

The current weighted score implementation determines bands. Showcase and BSCpE have a critical collision in week two; BSBA-FM and BSEd have a heavy project week; other weeks are lighter. Each section is a distinct academicSectionId, and every member shares the same section entries and scores. The program, term and year are not inferred from free-text Classroom labels. No LLM is called.

## Walkthrough

- **Admin:** sign in, switch to pitch section views. Home shows monitored sections/programs and roster population; Crunch Weeks shows one row per eligible section with weekly load. Click rows/weeks to inspect. The eight synthetic instructors and roster members are not real faculty or students.
- **Instructor:** sign in as the selected instructor, switch to pitch section views. Home shows four offerings and the 32-member cohort; Crunch Weeks shows shared section deadlines and the critical second week. Sections opens the existing deadline editor/collision checker. Any newly created unmarked records must be removed before reset; modifying seed records persists until reset.
- **Student:** sign in as the optional selected student, switch to pitch section views, and open Home, Timeline and Crunch Weeks. The shared score and deadlines apply equally to all 32 showcase members. Without a selected student the section views explain that no demo section is assigned.
- **Classroom:** leave pitch section mode or open Classroom to see real OAuth functionality. The demo does not connect to Google or provide simulated Classroom snapshots.

## Reset

As the active admin, with the feature flag enabled, open Pitch Demo Data, type `DELETE_ACADENCE_PITCH_DEMO`, and select **Reset Demo Data**. Reset deletes only records marked with this batch and the batch registry, including the demo membership of the optional real student; it never deletes the real student or instructor account. It refuses to proceed if unmarked records reference demo entities, or if a synthetic account acquired a Firebase UID. Resolve those references deliberately first; no unmarked data is removed. Ordinary OAuth connections and live snapshots are not touched. Disable `PITCH_DEMO_ENABLED` afterwards.

No live Convex deployment or Firebase account has been configured or verified by this implementation; run an end-to-end test in the intended dedicated deployment before presenting. The pitch mode is not an access-control bypass: existing role checks still apply.
