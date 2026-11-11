import {afterEach,describe,expect,it,vi} from 'vitest';
const previous=process.env.FIREBASE_PROJECT_ID;
afterEach(()=>{if(previous===undefined)delete process.env.FIREBASE_PROJECT_ID;else process.env.FIREBASE_PROJECT_ID=previous;vi.resetModules()});
describe('Firebase token provider',()=>{
 it('requires a configured Firebase project ID',async()=>{delete process.env.FIREBASE_PROJECT_ID;vi.resetModules();await expect(import('../convex/auth.config')).rejects.toThrow('FIREBASE_PROJECT_ID')});
 it('pins the Firebase issuer, audience and RS256 JWKS to the configured project',async()=>{process.env.FIREBASE_PROJECT_ID='example-project';vi.resetModules();const {default:config}=await import('../convex/auth.config');expect(config.providers).toEqual([{type:'customJwt',issuer:'https://securetoken.google.com/example-project',applicationID:'example-project',jwks:'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',algorithm:'RS256'}])});
});
