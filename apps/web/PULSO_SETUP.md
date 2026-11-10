# Pulso student demo

From `apps/web`, run `npm install` and `npm run dev`. The UI runs immediately with local sample data. The term starts October 12, 2026; dates and workload scores are calculated from the same deadlines rather than the inconsistent mock scores.

For syllabus extraction, create a Convex deployment with `npx convex dev`, set `NEXT_PUBLIC_CONVEX_URL` in `.env.local`, and set `GEMINI_API_KEY` and/or `MISTRAL_API_KEY` in the Convex dashboard (or with `npx convex env set`). Gemini is attempted first, with Mistral as fallback. PDF/DOCX parsing happens in the browser and only detected teaching matrix and grading sections are sent to the action. Review extracted data carefully.

The Convex schema and demo seed/query functions are included. **This is not production-ready for real student data:** authentication, enrollment authorization, secure account management, server-side ownership, and persistent user settings are not implemented. The current UI uses browser-local demo data and settings; sign-out and password changes explicitly report that an account connection is required. Extracted exams require Dean verification rather than granting students the ability to set them. Do not deploy the demo functions with real personal data until access controls are added.
