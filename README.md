# Acadence
<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=100&section=header&reversal=true&fontSize=70&fontColor=FFFFFF&fontAlign=50&fontAlignY=50&stroke=-&descSize=30&descAlign=50&descAlignY=50&textBg=false&color=gradient" />
</div>

<div align="center">
  <img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=100&section=footer&reversal=false&fontSize=70&fontColor=FFFFFF&fontAlign=50&fontAlignY=50&stroke=-&descSize=30&descAlign=50&descAlignY=50&textBg=false&color=gradient" />
</div>

## Seed the section dataset

Use a dedicated Convex development deployment, not production. The dataset is **fictional**; the Classroom integration uses separate real connections. From `apps/web`, configure your development deployment with `npx convex dev`, provision an active instructor in Pulso, and set the deployment environment variable `PITCH_DEMO_ENABLED=true`. A selected student account is optional and must have no existing primary section.

The following commands require Convex CLI access to that deployment. Replace the shell values with the Firebase UID and email of an **existing active Pulso admin** and the email of the approved instructor. The CLI's `--identity` impersonates that admin for this call; protect deployment access and do not use this mechanism from a browser. The server still checks the admin account and feature flag. Avoid putting any credential or token in the arguments.

```sh
cd apps/web
ADMIN_UID='existing-admin-firebase-uid'
ADMIN_EMAIL='existing-admin@lspu.edu.ph'
INSTRUCTOR_EMAIL='existing-instructor@lspu.edu.ph'
IDENTITY=$(printf '{"subject":"%s","tokenIdentifier":"firebase|%s","email":"%s"}' "$ADMIN_UID" "$ADMIN_UID" "$ADMIN_EMAIL")
ARGS=$(printf '{"instructorEmail":"%s","studentEmail":""}' "$INSTRUCTOR_EMAIL")
npx convex run --identity "$IDENTITY" demoSeed:preview "$ARGS"
SEED_ARGS=$(printf '{"instructorEmail":"%s","studentEmail":"","confirmation":"SEED_ACADENCE_PITCH_DEMO"}' "$INSTRUCTOR_EMAIL")
npx convex run --identity "$IDENTITY" demoSeed:seed "$SEED_ARGS"
# Deletes only the isolated batch; blocked when real records reference it.
npx convex run --identity "$IDENTITY" demoSeed:reset '{"confirmation":"DELETE_ACADENCE_PITCH_DEMO"}'
```

Set `studentEmail` in both JSON argument objects to an existing active student if needed. Use the same accounts on reruns. Remove the flag afterward. These commands target the Convex CLI's currently configured development deployment; verify the target before running. Live execution has not been verified in this workspace.
