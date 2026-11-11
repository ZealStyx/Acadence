import type {AuthConfig} from 'convex/server';
const projectId=process.env.FIREBASE_PROJECT_ID;
if(!projectId) throw new Error('Set FIREBASE_PROJECT_ID in the Convex deployment before deploying authentication.');
export default {providers:[{type:'customJwt',issuer:`https://securetoken.google.com/${projectId}`,applicationID:projectId,jwks:'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',algorithm:'RS256'}]} satisfies AuthConfig;
