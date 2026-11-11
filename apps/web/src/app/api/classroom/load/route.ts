import {anyApi} from 'convex/server';
import {listStudentCourses,listStudentCoursework,listTeacherCourses,listTeacherCoursework} from '../../../../../convex/classroomGoogle';
import {bearer,checkOrigin,config,errorResponse,googleToken,session,unseal} from '@/lib/server/classroom';
export const runtime='nodejs';
export async function POST(request:Request){try{
 checkOrigin(request);const user=await session(bearer(request));const connection=await user.client.query(anyApi.classroom.connection,{});
 if(!connection)return Response.json({connected:false},{headers:{'Cache-Control':'no-store'}});
 const refresh=unseal(connection.encryptedRefreshToken,`refresh:${user.uid}`),cfg=config();
 const token=await googleToken(new URLSearchParams({client_id:cfg.clientId,client_secret:cfg.clientSecret,refresh_token:refresh,grant_type:'refresh_token'}));
 if(typeof token.access_token!=='string')throw Error('Missing access');
 const courses=await (user.role==='student'?listStudentCourses(token.access_token):listTeacherCourses(token.access_token));
 const work=await Promise.allSettled(courses.map(c=>user.role==='student'?listStudentCoursework(token.access_token,c.googleCourseId):listTeacherCoursework(token.access_token,c.googleCourseId)));
 const rows=courses.map((course,i)=>({course,work:work[i].status==='fulfilled'?work[i].value:[],error:work[i].status==='rejected'}));
 let synced=false;const secret=process.env.CLASSROOM_SYNC_SECRET;
 if(secret){try{await user.client.mutation(anyApi.classroom.syncSnapshot,{secret,courses:rows.map(({course,work,error})=>({...course,workAvailable:!error,work:user.role==='instructor'?work.map(w=>({googleCourseWorkId:w.googleCourseWorkId,title:w.title,...(w.dueDate?{dueDate:w.dueDate}:{}),...('assigneeMode' in w&&w.assigneeMode?{assigneeMode:w.assigneeMode}:{})})):[]}))});synced=true}catch{/* The personal view still works when shared sync fails. */}}
 return Response.json({connected:true,courses:rows,synced},{headers:{'Cache-Control':'no-store'}});
 }catch{return errorResponse();}}
