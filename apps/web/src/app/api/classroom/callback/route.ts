import {NextRequest,NextResponse} from 'next/server';
import {anyApi} from 'convex/server';
import {config,googleToken,seal,session,unseal} from '@/lib/server/classroom';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 const cfg=config();let result='error';
 try{
  const cookie=request.cookies.get('pulso_classroom_oauth')?.value;if(!cookie)throw Error('Missing state');
  const state=JSON.parse(unseal(cookie,'oauth-state'));
  if(typeof state.state!=='string'||state.state!==request.nextUrl.searchParams.get('state')||state.expires<Date.now()||!request.nextUrl.searchParams.get('code'))throw Error('Invalid state');
  const user=await session(state.idToken);if(user.uid!==state.uid||user.googleId!==state.googleId)throw Error('Identity changed');
  const token=await googleToken(new URLSearchParams({code:request.nextUrl.searchParams.get('code')!,client_id:cfg.clientId,client_secret:cfg.clientSecret,redirect_uri:cfg.redirectUri,grant_type:'authorization_code',code_verifier:state.verifier}));
  if(typeof token.access_token!=='string'||typeof token.refresh_token!=='string')throw Error('Missing access');
  const info=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:`Bearer ${token.access_token}`},cache:'no-store'});if(!info.ok)throw Error('Identity lookup failed');
  const profile=await info.json();if(profile.sub!==user.googleId)throw Error('Account mismatch');
  await user.client.mutation(anyApi.classroom.saveConnection,{encryptedRefreshToken:seal(token.refresh_token,`refresh:${user.uid}`)});result='connected';
 }catch{/* Never include OAuth data or tokens in redirects. */}
 const response=NextResponse.redirect(`${cfg.origin}/?classroom=${result}`);response.cookies.set('pulso_classroom_oauth','',{httpOnly:true,secure:cfg.origin.startsWith('https:'),sameSite:'lax',path:'/api/classroom/callback',maxAge:0});response.headers.set('Cache-Control','no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
}
