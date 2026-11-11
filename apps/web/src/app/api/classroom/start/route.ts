import {NextResponse} from 'next/server';
import {bearer,challenge,checkOrigin,config,errorResponse,random,seal,session} from '@/lib/server/classroom';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  checkOrigin(request);const idToken=bearer(request);const user=await session(idToken);const cfg=config();
  const state=random(),verifier=random();
  const cookie=seal(JSON.stringify({state,verifier,idToken,uid:user.uid,googleId:user.googleId,expires:Date.now()+10*60*1000}),'oauth-state');
  const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search=new URLSearchParams({client_id:cfg.clientId,redirect_uri:cfg.redirectUri,response_type:'code',scope:`openid https://www.googleapis.com/auth/classroom.courses.readonly https://www.googleapis.com/auth/classroom.coursework.${user.role==='student'?'me':'students'}.readonly`,access_type:'offline',prompt:'consent',state,code_challenge:challenge(verifier),code_challenge_method:'S256'}).toString();
  const response=NextResponse.json({url:url.toString()},{headers:{'Cache-Control':'no-store'}});
  response.cookies.set('pulso_classroom_oauth',cookie,{httpOnly:true,secure:cfg.origin.startsWith('https:'),sameSite:'lax',path:'/api/classroom/callback',maxAge:600});return response;
 }catch{return errorResponse();}
}
