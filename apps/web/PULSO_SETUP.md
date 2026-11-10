# Pulso setup and implementation status

From `apps/web`, run `npm ci`, `npm test`, and `npm run dev` (or `npm run build`). The app requires Convex and Google sign-in configuration; it does not silently fall back to sample data. There is no syllabus upload or import.

## Configuration

1. Create an OAuth 2.0 **Web application** client in Google Cloud. Configure its consent screen, add each exact Vercel origin (and `http://localhost:3000` for local development) under **Authorized JavaScript origins**, and follow Google Workspace's publishing/test-user requirements. The Google client ID is public, not a client secret.
2. Set `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` as Vercel environment variables for the appropriate environments, and redeploy the frontend. Use the same Google client ID for the frontend and the Convex auth provider. For local development put those two variables in `apps/web/.env.local`.
3. In the intended **Convex deployment**, set `AUTH_GOOGLE_CLIENT_ID` to that Google client ID and `PULSO_BOOTSTRAP_ADMIN_EMAIL` to the first administrator's verified university Google email (the `0000-0000@lspu.edu.ph` format). For example, with the Convex CLI connected to the right deployment: `npx convex env set AUTH_GOOGLE_CLIENT_ID <client-id>` and `npx convex env set PULSO_BOOTSTRAP_ADMIN_EMAIL <email>`. For production use the Convex dashboard or the CLI production option. Deploy the Convex functions, including `auth.config.ts`, to the same deployment as the public URL. **Setting variables alone does not deploy functions.**
4. The first administrator signs in through the app and clicks **Set up first administrator**. The server permits this once, only for the verified email in the bootstrap setting. Remove `PULSO_BOOTSTRAP_ADMIN_EMAIL` after setup. The administrator can then approve other accounts, create sections and enroll students from the app.

If deploying Convex functions as part of Vercel builds, set the private `CONVEX_DEPLOY_KEY` as a sensitive Vercel environment variable and use a build command such as `npx convex deploy --cmd 'npm run build'` with the Vercel root directory set to `apps/web`. Ensure the deploy key points to the same deployment as `NEXT_PUBLIC_CONVEX_URL` and that deployment already has its Google environment configured. Otherwise deploy the Convex functions separately. Never expose the deploy key in a `NEXT_PUBLIC_` variable, commit it, or share it in chat. Redeploy after changing Vercel environment variables.

## Access and limitations

Verified Google sign-in alone does not grant access: an enabled account must be provisioned by an administrator. Server-side checks enforce role, section ownership and enrollment. The email format applies to all roles. Domain-format checking is not a substitute for university account governance; ensure the organization controls account issuance and revocation. Pulso does not automatically synchronize Google account status or roles.

The Google ID token is held only in memory; reloading or an expired token requires signing in again. Google sign-in requires browser access to Google's identity script. Google and Convex configuration and the actual Vercel domain are needed to verify the full sign-in flow. No live deployment or real Google sign-in was tested in this workspace.

Instructors can manually create, edit and delete deadlines and see aggregate collision estimates; students see deadlines from their enrollments; admins manage access and see aggregate heatmaps (groups under five are suppressed). The AI study assistant in the updated plan is not implemented. The current screens do not implement every planned feature or profile preference. The system needs end-to-end testing, operational review, privacy/retention policies and scale testing before use with real student data. Previous sample tables remain in the schema only to avoid destroying legacy data; they are not accessed by the current APIs. Migrate or remove them deliberately before production use.

The revised source plan is `docs/project-plan.md`; it describes the target, not a claim that all features are complete.
