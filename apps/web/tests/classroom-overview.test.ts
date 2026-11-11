import {describe,it,expect} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as classroom from '../convex/classroom';
import * as admin from '../convex/admin';
import * as instructor from '../convex/instructor';
const {api,createTest}=defineTestApp({schema}).defineModules({classroom,admin,instructor});
const ident=(subject:string)=>({subject,tokenIdentifier:`firebase|${subject}`,email:`${subject}@lspu.edu.ph`});
const secret='abcdefghijklmnopqrstuvwxyz0123456789';
describe('Classroom subject sync',()=>{
 it('requires a server secret, isolates membership, deduplicates and suppresses small groups',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();
  await t.run(async ctx=>{for(const [uid,role] of [['admin','admin'],['teacher','instructor'],['teacher2','instructor'],...Array.from({length:5},(_,i)=>[`s${i}`,'student'])] as [string,'admin'|'instructor'|'student'][]){await ctx.db.insert('accounts',{firebaseUid:uid,email:`${uid}@lspu.edu.ph`,name:uid,role,active:true})}});
  const teacher=t.withIdentity(ident('teacher')),teacher2=t.withIdentity(ident('teacher2')),adminUser=t.withIdentity(ident('admin'));
  const course={googleCourseId:'c',name:'Subject',courseState:'ACTIVE',workAvailable:true,work:[{googleCourseWorkId:'w',title:'Exam',dueDate:'2026-11-09',assigneeMode:'ALL_STUDENTS'},{googleCourseWorkId:'targeted',title:'Individual',dueDate:'2026-11-09',assigneeMode:'INDIVIDUAL_STUDENTS'}]};
  await expect(teacher.mutation(api.classroom.syncSnapshot,{secret:'wrong',courses:[course]})).rejects.toThrow();
  await teacher.mutation(api.classroom.syncSnapshot,{secret,courses:[course]});await teacher2.mutation(api.classroom.syncSnapshot,{secret,courses:[course]});
  await teacher.mutation(api.classroom.confirmReview,{googleCourseId:'c',googleCourseWorkId:'w',category:'exam'});await teacher2.mutation(api.classroom.confirmReview,{googleCourseId:'c',googleCourseWorkId:'w',category:'exam'});await teacher.mutation(api.classroom.confirmReview,{googleCourseId:'c',googleCourseWorkId:'targeted',category:'exam'});
  for(let i=0;i<4;i++)await t.withIdentity(ident(`s${i}`)).mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'c',name:'Subject',workAvailable:true,work:[]}]});
  let overview=await adminUser.query(api.admin.classroomOverview,{weekStarts:['2026-11-09']});expect(overview.subjects[0].eligible).toBe(false);expect(overview.subjects[0].weeks[0].load).toBeNull();expect(overview.subjects[0].weeks[0].items).toEqual([]);
  await t.withIdentity(ident('s4')).mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'c',name:'Subject',workAvailable:true,work:[]}]});
  overview=await adminUser.query(api.admin.classroomOverview,{weekStarts:['2026-11-09']});expect(overview.subjects[0].studentCount).toBe(5);expect(overview.subjects[0].weeks[0].load).toBe(3);expect(overview.subjects[0].weeks[0].items).toHaveLength(1);
  expect((await t.withIdentity(ident('s0')).query(api.classroom.studentConfirmed,{})).entries.map(x=>x.title)).toEqual(['Exam']);
  await expect(t.withIdentity(ident('s0')).query(api.admin.classroomOverview,{weekStarts:['2026-11-09']})).rejects.toThrow();
  await t.withIdentity(ident('s0')).mutation(api.classroom.removeConnection,{});expect((await t.withIdentity(ident('s0')).query(api.classroom.studentConfirmed,{})).entries).toEqual([]);
  delete process.env.CLASSROOM_SYNC_SECRET;
 });
});

describe('instructor Classroom crunch weeks',()=>{
 it('shows every own class separately and excludes other instructors and unconfirmed or targeted work',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();
  await t.run(async ctx=>{for(const [uid,role] of [['teacher','instructor'],['other','instructor'],['student','student'],['admin','admin']] as const)await ctx.db.insert('accounts',{firebaseUid:uid,email:`${uid}@lspu.edu.ph`,name:uid,role,active:true})});
  const teacher=t.withIdentity(ident('teacher')),other=t.withIdentity(ident('other'));
  const work=[{googleCourseWorkId:'w',title:'Quiz',dueDate:'2026-11-09',assigneeMode:'ALL_STUDENTS'},{googleCourseWorkId:'x',title:'Private',dueDate:'2026-11-09',assigneeMode:'INDIVIDUAL_STUDENTS'}];
  await teacher.mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'a',name:'Math',section:'3A',courseState:'ACTIVE',workAvailable:true,work},{googleCourseId:'b',name:'Science',section:'3A',courseState:'ACTIVE',workAvailable:true,work:[]},{googleCourseId:'c',name:'History',courseState:'ARCHIVED',workAvailable:false,work:[]}]});
  await other.mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'d',name:'Other',section:'3A',courseState:'ACTIVE',workAvailable:true,work:[]}]});
  await teacher.mutation(api.classroom.confirmReview,{googleCourseId:'a',googleCourseWorkId:'w',category:'quiz'});await teacher.mutation(api.classroom.confirmReview,{googleCourseId:'a',googleCourseWorkId:'x',category:'exam'});
  const rows=await teacher.query(api.instructor.classroomOverview,{weekStarts:['2026-11-09']});expect(rows.map(r=>r.name)).toEqual(['History','Math','Science']);expect(rows.find(r=>r.id==='a')?.weeks[0].items.map(x=>x.title)).toEqual(['Quiz']);expect(rows.find(r=>r.id==='a')?.weeks[0].load).toBe(1);expect(rows.find(r=>r.id==='b')?.section).toBe('3A');
  const all=await t.withIdentity(ident('admin')).query(api.admin.classroomOverview,{weekStarts:['2026-11-09']});expect(all.subjects.map(s=>s.name)).toEqual(['History','Math','Other','Science']);
  await expect(t.withIdentity(ident('student')).query(api.instructor.classroomOverview,{weekStarts:['2026-11-09']})).rejects.toThrow();
  await expect(teacher.query(api.instructor.classroomOverview,{weekStarts:['2026-11-10']})).rejects.toThrow();
  delete process.env.CLASSROOM_SYNC_SECRET;
 });
});
