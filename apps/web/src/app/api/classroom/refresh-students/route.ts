import {anyApi} from 'convex/server';
import {listStudentCourses,listStudentCoursework} from '../../../../../convex/classroomGoogle';
import {studentWeeklyCounts} from '@/lib/server/studentWeeklyCounts';
import {bearer,checkOrigin,config,errorResponse,googleToken,session,unseal} from '@/lib/server/classroom';
export const runtime='nodejs';
export async function POST(request:Request){try{
 checkOrigin(request);const user=await session(bearer(request),['admin']);const body=await request.json();
 if(!body||!(body.cursor===null||typeof body.cursor==='string')||(typeof body.cursor==='string'&&body.cursor.length>4096))throw Error('Invalid cursor');
 const secret=process.env.CLASSROOM_SYNC_SECRET;if(!secret||secret.length<32)throw Error('Sync unavailable');
 const cfg=config();const batch=await user.client.query(anyApi.adminRefresh.studentConnections,{secret,cursor:body.cursor});
 const outcomes=await Promise.all(batch.students.map(async (s:{uid:string;accountId:string;connectionId:string;encryptedRefreshToken:string})=>{
  const startedAt=Date.now();const identity={secret,accountId:s.accountId,connectionId:s.connectionId,encryptedRefreshToken:s.encryptedRefreshToken,startedAt};
  try{
   const refresh=unseal(s.encryptedRefreshToken,`refresh:${s.uid}`);const token=await googleToken(new URLSearchParams({client_id:cfg.clientId,client_secret:cfg.clientSecret,refresh_token:refresh,grant_type:'refresh_token'}));if(typeof token.access_token!=='string')throw Error('Missing access');
   const courses=await listStudentCourses(token.access_token);const work=await Promise.allSettled(courses.map(c=>listStudentCoursework(token.access_token,c.googleCourseId)));
   await user.client.mutation(anyApi.adminRefresh.saveStudentSnapshot,{...identity,courses:courses.map((course,i)=>({...course,workAvailable:work[i].status==='fulfilled',...(work[i].status==='fulfilled'?{weeklyCounts:studentWeeklyCounts(work[i].value)}:{})}))});
   return work.some(w=>w.status==='rejected')?'partial':'ok';
  }catch{try{await user.client.mutation(anyApi.adminRefresh.markStudentUnavailable,identity)}catch{/* connection may have changed */}return 'failed';}
 }));
 return Response.json({done:batch.done,cursor:batch.done?null:batch.cursor,processed:outcomes.length,failed:outcomes.filter(x=>x!=='ok').length},{headers:{'Cache-Control':'no-store'}});
}catch{return errorResponse();}}
