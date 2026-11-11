# Acadence interface notes

Acadence and the existing `public/logo.png` are the approved brand for this iteration. The active workspace remains `Workspace.tsx`; its student, instructor and admin components consume the existing queries and mutations. Legacy/demo components were not deleted.

## Shared styles

`src/app/globals.css` retains older compatibility rules and contains a labelled Acadence design foundation near the end. It is formatted for readability; some legacy overrides remain intentionally because their consumers have not all been audited. The foundation defines `--color-*`, `--space-*`, `--radius-card` and `--shadow-card`. Reusable patterns include `.card`, `.panel`, `.staff-header`, `.primary`, `.secondary`, `.field`, `.chip`, `.state-card`, `.empty-state`, `.filter-bar`, `.deadline-item`, `.dash-table-wrap` and `.connection-panel`. Status labels accompany colors; unavailable data is not treated as zero.

The existing shared shell retains role-specific destinations, a role/account summary and visible focus treatment. The mobile bottom navigation uses safe-area padding. Wide heatmaps are labelled horizontal scroll regions. Account changes and Classroom disconnects use browser confirmation dialogs; the profile edit dialog retains its existing focus trap and Escape handling. The CSS retains reduced-motion and larger-text preferences.

The Student pages show the student’s dated Classroom coursework without instructor confirmation. Their optional AI-estimated personal preview uses the same 1/2/3 points and 6/10 thresholds; it is not a confirmed or shared workload score. Assignment titles and work types are sent to Gemini for estimates. The API is rate-limited for connected student and instructor accounts. The instructor matrix remains per Classroom class. Admin Crunch Weeks groups students by matching Classroom section labels as an approximation, not as verified cohorts, and shows unscored average item counts with privacy suppression.

## Verification and remaining checks

Automated backend tests and the Next.js production build are the executable checks in this sandbox. A local browser screenshot attempt was blocked by missing system libraries (`libnss3`/`libnspr4`); authenticated roles also require real Firebase, Convex, and Classroom sessions. Before release, capture and review signed-in student, instructor and admin screens at 1440, 1280, 1024, 768, 390 and 360 pixels. Verify actual content overflow, keyboard access (including native confirmations), focus return, larger text, reduced motion, contrast, category confirmation, filtering, OAuth connect/refresh/disconnect and profile edits. No synthetic sample-data preview was added.
