import {anyApi} from 'convex/server';
import {bearer,checkOrigin,errorResponse,session,unseal} from '@/lib/server/classroom';
export const runtime='nodejs';
export async function POST(request:Request){try{
 checkOrigin(request);const user=await session(bearer(request));const connection=await user.client.query(anyApi.classroom.connection,{});
 let revoked=true;
 if(connection){const refresh=unseal(connection.encryptedRefreshToken,`refresh:${user.uid}`);try{const response=await fetch('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:refresh}),cache:'no-store'});revoked=response.ok;}catch{revoked=false;}}
 await user.client.mutation(anyApi.classroom.removeConnection,{});
 return Response.json({revoked},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse();}}
