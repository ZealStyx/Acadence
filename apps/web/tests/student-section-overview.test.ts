import {describe,it,expect} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as classroom from '../convex/classroom';
import * as admin from '../convex/admin';
import {studentWeeklyCounts} from '../src/lib/server/studentWeeklyCounts';
const {api,createTest}=defineTestApp({schema}).defineModules({classroom,admin});
const identity=(subject:string)=>({subject,tokenIdentifier:`firebase|${subject}`,email:`${subject}@lspu.edu.ph`});
const secret='abcdefghijklmnopqrstuvwxyz0123456789';
describe('student-based section heatmap',()=>{
 it('counts dated visible work without persisting item details and deduplicates per course',()=>{
  const item={googleCourseId:'c',googleCourseWorkId:'w',title:'Private',state:'PUBLISHED' as const,updatedAt:1,dueDate:'2026-11-11'};
  expect(studentWeeklyCounts([item,item,{...item,googleCourseWorkId:'x',dueDate:undefined},{...item,googleCourseWorkId:'y',dueDate:'2026-11-12'}])).toEqual([{start:'2026-11-09',count:2}]);
 });
 it('uses student snapshots without instructor, merges matching section labels, and preserves privacy',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();await t.run(async ctx=>{
   await ctx.db.insert('accounts',{firebaseUid:'admin',email:'admin@lspu.edu.ph',name:'Admin',role:'admin',active:true});
   for(let i=0;i<6;i++)await ctx.db.insert('accounts',{firebaseUid:`s${i}`,email:`s${i}@lspu.edu.ph`,name:`S${i}`,role:'student',active:i!==5});
  });const root=t.withIdentity(identity('admin'));
  for(let i=0;i<5;i++){
   const user=t.withIdentity(identity(`s${i}`));await user.mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'a',name:'Math',section:i%2?' BSIT  3A ':'bsit 3a',workAvailable:true,work:[],weeklyCounts:[{start:'2026-11-09',count:i+1}]},{googleCourseId:'b',name:'Science',section:'BSIT 3A',workAvailable:true,work:[],weeklyCounts:[{start:'2026-11-09',count:1}]},{googleCourseId:'orphan',name:'Unnamed class',workAvailable:true,work:[],weeklyCounts:[]}]});
  }
  let groups=await root.query(api.admin.studentSectionOverview,{weekStarts:['2026-11-09']});const group=groups.find(g=>g.id==='section:bsit 3a')!;expect(group.status).toBe('available');expect(group.studentCount).toBe(5);expect(group.weeks[0].average).toBe(4);expect(groups.find(g=>g.unlabelled)?.status).toBe('available');expect(JSON.stringify(groups)).not.toContain('S0');
  await expect(t.withIdentity(identity('s0')).query(api.admin.studentSectionOverview,{weekStarts:['2026-11-09']})).rejects.toThrow();
  await t.withIdentity(identity('s0')).mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'a',name:'Math',section:'BSIT 3A',workAvailable:false,work:[]}]});
  groups=await root.query(api.admin.studentSectionOverview,{weekStarts:['2026-11-09']});expect(groups.find(g=>g.id==='section:bsit 3a')?.status).toBe('unavailable');expect(groups.find(g=>g.id==='section:bsit 3a')?.weeks[0].average).toBeNull();expect(groups.find(g=>g.unlabelled)?.status).toBe('suppressed');
  delete process.env.CLASSROOM_SYNC_SECRET;
 });
 it('rejects malformed weekly totals and leaves existing snapshots intact',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();await t.run(ctx=>ctx.db.insert('accounts',{firebaseUid:'s',email:'s@lspu.edu.ph',name:'S',role:'student',active:true}));const s=t.withIdentity(identity('s'));
  const course={googleCourseId:'c',name:'Course',workAvailable:true,work:[],weeklyCounts:[{start:'2026-11-09',count:2}]};await s.mutation(api.classroom.syncSnapshot,{secret,courses:[course]});await expect(s.mutation(api.classroom.syncSnapshot,{secret,courses:[{...course,weeklyCounts:[{start:'2026-11-10',count:3}]}]})).rejects.toThrow();expect((await t.run(ctx=>ctx.db.query('classroomSnapshots').collect()))[0].weeklyCounts).toEqual(course.weeklyCounts);delete process.env.CLASSROOM_SYNC_SECRET;
 });
});
