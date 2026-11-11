# Firebase-to-Convex integration: initial assessment

The plan assumes an existing Firebase Authentication session, but the current checkout does not contain one. As of this assessment:

- `apps/web/package.json` uses Convex 1.49, Next.js 15 and React 19; Firebase is not installed.
- `apps/web/src/app/page.tsx` initializes Google Identity Services directly, holds the Google ID token in memory, creates the single `ConvexReactClient`, and wraps the signed-in view with `ConvexProviderWithAuth`. It does not use Firebase or persist a Firebase session.
- `apps/web/src/app/layout.tsx` is the Next.js root layout; the Convex provider currently lives in the page, not a shared provider module.
- `apps/web/convex/auth.config.ts` currently trusts Google ID tokens via the Google issuer and `AUTH_GOOGLE_CLIENT_ID`, not Firebase ID tokens.
- `apps/web/convex/accounts.ts`, `access.ts`, and `schema.ts` use administrator-provisioned accounts keyed by verified university email; no Firebase UID is stored. Protected functions use `requireAccount` and `requireCourseOwner`.
- `apps/web/src/lib/convex.ts` is empty; there is no other Convex client or provider in this checkout.

Consequently, the plan's acceptance check that existing Firebase Google Sign-In works cannot be verified here, and a Firebase adapter cannot be connected to an existing Firebase Auth instance without its source. Switching the current provider to Firebase without also establishing a trusted Firebase UID mapping for existing profiles would change or break access. Existing records and roles must not be remapped based on unverified client-supplied identity.

Before implementing phases 1–4, locate the Firebase-based implementation if it exists elsewhere, or explicitly decide to migrate the current Google Identity Services login to Firebase Authentication. Then configure the actual Firebase project ID and verify the issuer, audience, RS256 JWKS and token key IDs against a real deployment. The Google Classroom OAuth credentials remain separate. No credentials should be committed or shared in chat. Classroom OAuth and sync remain out of scope until authentication is verified.

## Decision and implementation

The user approved migrating the existing direct Google Identity Services flow to Firebase Google Sign-In. The visible Google sign-in entry remains, now backed by one Firebase Auth instance and a refresh-aware Convex provider. `accounts.firebaseUid` is optional for legacy records; a verified email can link an existing approved, active record exactly once, after which server-side authorization uses the UID. Administrators must review email ownership before migration because an email address can be reassigned. The model and existing relationships are preserved; unapproved users cannot self-assign a role.

The configured Firebase signing-key endpoint was inspected and returned a JWKS with RSA/RS256 keys. A real Firebase project's token and matching `kid`, live deployment configuration, issuer/audience/signature rejection, session persistence and refresh remain unverified. `convex-test` injects mock identities and cannot validate JWT signatures. See `apps/web/ACADENCE_SETUP.md` for cutover and live testing.
