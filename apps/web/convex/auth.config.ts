// Configure AUTH_GOOGLE_CLIENT_ID in the Convex deployment, not in source control.
export default {
  providers: [{domain: 'https://accounts.google.com', applicationID: process.env.AUTH_GOOGLE_CLIENT_ID!}],
};
