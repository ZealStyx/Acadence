import 'server-only';
import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';

export function config(){
 const {GOOGLE_CLASSROOM_CLIENT_ID:clientId,GOOGLE_CLASSROOM_CLIENT_SECRET:clientSecret,CLASSROOM_ENCRYPTION_KEY:key,CLASSROOM_REDIRECT_URI:redirectUri,NEXT_PUBLIC_CONVEX_URL:convexUrl}=process.env;
 if(!clientId||!clientSecret||!key||!redirectUri||!convexUrl)throw new Error('Classroom server is not configured.');
 const bytes=Buffer.from(key,'base64');if(bytes.length!==32||bytes.toString('base64')!==key)throw new Error('Invalid Classroom encryption key.');
 const redirect=new URL(redirectUri);if(redirect.protocol!=='https:'&&redirect.hostname!=='localhost')throw new Error('Classroom redirect must use HTTPS.');
 if(redirect.pathname!=='/api/classroom/callback'||redirect.search||redirect.hash)throw new Error('Invalid Classroom redirect URI.');
 return {clientId,clientSecret,key:bytes,redirectUri,convexUrl,origin:redirect.origin};
}
export function seal(value:string,aad:string){const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',config().key,iv);cipher.setAAD(Buffer.from(aad));const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);return ['v1',iv.toString('base64url'),data.toString('base64url'),cipher.getAuthTag().toString('base64url')].join('.');}
export function unseal(value:string,aad:string){const parts=value.split('.');if(parts.length!==4||parts[0]!=='v1')throw new Error('Invalid encrypted data.');const decipher=createDecipheriv('aes-256-gcm',config().key,Buffer.from(parts[1],'base64url'));decipher.setAAD(Buffer.from(aad));decipher.setAuthTag(Buffer.from(parts[3],'base64url'));return Buffer.concat([decipher.update(Buffer.from(parts[2],'base64url')),decipher.final()]).toString('utf8');}
export function random(){return randomBytes(32).toString('base64url');}
export function challenge(verifier:string){return createHash('sha256').update(verifier).digest('base64url');}
export async function session(token:string){
 const client=new ConvexHttpClient(config().convexUrl);client.setAuth(token);
 const account=await client.query(anyApi.accounts.me,{});
 if(!['student','instructor'].includes(account.role)||!account.firebaseUid)throw new Error('Student or instructor access required.');
 // Convex has verified the token before we read its provider identity.
 const payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString('utf8'));
 const ids=payload?.firebase?.identities?.['google.com'];
 if(payload.sub!==account.firebaseUid||!Array.isArray(ids)||typeof ids[0]!=='string')throw new Error('Google sign-in required.');
 return {client,uid:account.firebaseUid as string,googleId:ids[0] as string,role:account.role as 'student'|'instructor'};
}
export function bearer(request:Request){const auth=request.headers.get('authorization');if(!auth?.startsWith('Bearer '))throw new Error('Sign in required.');return auth.slice(7);}
export function checkOrigin(request:Request){if(request.headers.get('origin')!==config().origin)throw new Error('Invalid request origin.');}
export async function googleToken(params:URLSearchParams){const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:params,cache:'no-store'});if(!res.ok)throw new Error('Google token request failed.');return await res.json();}
export function errorResponse(){return Response.json({error:'Classroom request failed. Check configuration and reconnect if necessary.'},{status:400,headers:{'Cache-Control':'no-store'}});}
