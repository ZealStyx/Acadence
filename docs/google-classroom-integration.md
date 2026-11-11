# Google Classroom integration: implementation plan

**Status: prototype in progress.** A student can connect a Google account through a separate read-only OAuth flow, then view active classes and published coursework and refresh them. Refresh tokens are encrypted server-side and saved per student; coursework is fetched on request. The persistent flow has not yet been tested with a real Google account or deployed. Instructor integration and background sync are not implemented. The design below describes the fuller planned integration, not all current behavior. Manual deadlines remain available; there is no syllabus upload or parsing.

## Goals and boundaries

- Keep the existing Firebase Google sign-in and Convex UID-based authorization. Classroom access is an **optional, separate OAuth connection**, not a replacement login or a new role-assignment mechanism. Administrators manage Pulso roles, academic sections and memberships.
- Classroom is the source of truth for Classroom content. The first integration reads coursework; it does not publish, edit, grade, return or turn in work. Link users back to Classroom for those actions.
- Scores for a fixed academic section use the same shared deadlines for every member. Unmapped or individually assigned work stays separate as a personal adjustment, never silently affecting the section score.
- Do not trust a course title, email address or matching subject name as proof of a student or section mapping. An email domain check alone is not proof of mailbox ownership; design explicit, authenticated account linking and roster verification before using Classroom data across users.

## Two connection paths

### A. Student connection (first milestone)

1. An authenticated student initiates a separate Google consent flow and connects their own Classroom account.
2. List courses visible to that Google account; let the student select courses and manually request a sync.
3. Retrieve only published coursework visible to the student. Show unmapped courses as personal adjustments, separate from the section's official schedule and score.
4. Support deselecting a course and disconnecting the connection. Explain the retention/deletion behavior before asking for consent.
5. A missing due date does not become a fabricated deadline; show it as unscheduled or omit it from workload calculations.

### B. Instructor course-offering connection (second milestone)

1. An authenticated instructor connects their own Classroom account and selects a course they are authorized to teach.
2. Map it explicitly to an existing Pulso course offering (subject + academic section + term); never create a section, course offering, or membership from a name match.
3. Verify the Classroom roster against the Pulso section before treating published course-wide work as shared. Uncertain and individually assigned work must not be exposed or counted as shared without a verified mapping.
4. Show teacher-visible drafts, scheduled and deleted items only to authorized instructors. A tentative collision preview must not add unpublished work to the official timeline or score. Classroom `scheduledTime` is a publish timestamp, not a deadline.
5. Keep Pulso's assessment type, grade weight, and other instructor-entered metadata on sync. Do not infer a grade weight from Classroom points.

## Proposed architecture

- **Browser:** explicit connect/disconnect and course-selection controls, sync status, and links back to Classroom. Never expose refresh tokens.
- **Server-side OAuth boundary:** use a separate Classroom OAuth client, exact redirect URI, authorization code exchange, state bound to the initiating authenticated session, and PKCE where supported. Reject reused, expired or mismatched state. Verify the connected Google identity independently; do not link users solely by email. Review provider behavior and current Google requirements before implementation.
- **Credential storage:** encrypt refresh tokens using a server-only key; keep key and OAuth client secret out of frontend variables, logs, and Git. Bind each connection to the Pulso Firebase UID and authorize every read, sync and disconnect. Plan key rotation, token revocation and cleanup before launch.
- **Convex:** authenticated queries and mutations for user-visible connection metadata and mappings; server-side actions for OAuth exchange and Classroom API calls. Never return credentials to clients. Handle retries, pagination, rate limits and expired/revoked grants explicitly; record safe sync status without logging tokens or coursework descriptions unnecessarily.
- **Sync records:** retain Google course ID and coursework ID, source link, update timestamp, state, scheduled publish time, due date/time, assignee mode and mapping provenance. Keep personal and shared visibility separate. Upsert idempotently by stable Classroom identifiers; a manual Pulso deadline is not automatically merged with a Classroom item.

The exact storage model, API endpoints, token encryption mechanism, and authorization checks are design work for implementation—not existing functionality. Convex actions and queries must independently enforce ownership and role checks; hiding controls in the UI is insufficient.

## Permissions and setup

1. Configure a separate Google Cloud OAuth client and enable the Classroom API for the intended project. Configure the consent screen and exact redirect URIs for each environment. Do not reuse Classroom credentials as Firebase login credentials.
2. Check the school domain's third-party app policy, test-user requirements, OAuth verification and permitted scopes before promising an integration.
3. Request the minimum read-only scopes needed for each implemented API method and user role. The candidate scopes in section 2.6 of the project plan are starting points: verify the current official method-specific scope requirements at implementation time. Request optional submission or roster scopes only when needed and reviewed; no write scopes for the first release.
4. Store secrets only in the appropriate server-side deployment settings. Use a different configuration for development and production. Never commit credentials or place them in `NEXT_PUBLIC_` variables.

## Delivery sequence and acceptance checks

1. **Security and data design:** document OAuth callback/state, connection identity, encrypted credential lifecycle, schema and access checks. Agree on retention, disconnect semantics, roster verification and privacy policy before syncing real student data.
2. **Student connection:** complete consent, select courses, sync published student-visible work and disconnect. Verify empty courses, missing due dates, denied consent, revoked grants, retries and pagination.
3. **Instructor mapping:** map an authorized teacher's course to an existing offering and explicitly verify its roster. Test unmapped, mismatched and incomplete rosters; manual deadlines remain usable.
4. **Shared sync and collision preview:** add verified published course-wide work to the shared section schedule; keep draft/scheduled/deleted items instructor-only. Preserve manually entered metadata and ensure repeated syncs don't duplicate work.
5. **Cross-path deduplication:** when the same course/work item is present through both paths, use the Google course ID plus coursework ID and enforce each user's visibility. Individually assigned work and uncertain roster matches must not leak or alter shared scores.
6. **Operational readiness:** test student and teacher accounts separately, expired/revoked access, transient failures, source deletions, reconnect, disconnect, token/key rotation and two distinct sections. Confirm privacy and OAuth reviews before public use.

No integration should be described as complete until deployed against real authorized Classroom accounts and tested end to end. Existing mock Convex tests do not exercise Google OAuth or the Classroom API.
