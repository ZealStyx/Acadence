# Pulso student demo

From `apps/web`, run `npm install` and `npm run dev`. The UI runs immediately with local sample data. The term starts October 12, 2026; dates and workload scores are calculated from the same deadlines rather than the inconsistent mock scores.

For syllabus extraction, create a Convex deployment with `npx convex dev`, set `NEXT_PUBLIC_CONVEX_URL` in `.env.local`, and set `GEMINI_API_KEY` and/or `MISTRAL_API_KEY` in the Convex dashboard (or with `npx convex env set`). Gemini is attempted first, with Mistral as fallback. PDF/DOCX parsing happens in the browser and only detected teaching matrix and grading sections are sent to the action. Review extracted data carefully.

The Convex schema and demo seed/query functions are included. **This is not production-ready for real student data:** authentication, enrollment authorization, secure account management, server-side ownership, and persistent user settings are not implemented. The current UI uses browser-local demo data and settings; sign-out and password changes explicitly report that an account connection is required. Extracted exams require Dean verification rather than granting students the ability to set them. Do not deploy the demo functions with real personal data until access controls are added.

The entry screen has an explicit **student demo** button. It sets a session-only browser flag and is not authentication or an access-control mechanism. The sign-in form does not send or validate credentials; university authentication and role-based authorization must be implemented before real use. Sign out clears the demo flag, not a university session.

### Instructor and admin demos
The login screen offers separate student, instructor, and admin demos. These are client-side sample experiences, **not authentication or role-based authorization**. Instructor deadlines and profile preferences are stored only in the current browser; the admin heatmap uses illustrative cohort data. Neither demo accesses real university records or sends notifications. Real accounts, permissions and shared scheduling need server-side implementation before deployment.
