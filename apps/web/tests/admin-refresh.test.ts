import {describe,it,expect,afterEach} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as classroom from '../convex/classroom';
import * as adminRefresh from '../convex/adminRefresh';
import * as admin from '../convex/admin';
const {api,createTest}=defineTestApp({schema}).defineModules({classroom,adminRefresh,admin});
const secret='abcdefghijklmnopqrstuvwxyz0123456789';
const ident=(subject:string)=>({subject,tokenIdentifier:`firebase|${subject}`,email:`${subject}@lspu.edu.ph`});
afterEach(()=>delete process.env.CLASSROOM_SYNC_SECRET);
describe('admin student refresh bridge',()=>{
 it('requires both admin authorization and the server secret, without instructor dependency',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();const id=await t.run(async ctx=>{await ctx.db.insert('accounts',{firebaseUid:'admin',email:'admin@lspu.edu.ph',name:'Admin',role:'admin',active:true});return ctx.db.insert('accounts',{firebaseUid:'s',email:'s@lspu.edu.ph',name:'Student',role:'student',active:true})});
  const student=t.withIdentity(ident('s')),administrator=t.withIdentity(ident('admin'));await student.mutation(api.classroom.saveConnection,{encryptedRefreshToken:'v1.cipher'});
  await expect(student.query(api.adminRefresh.studentConnections,{secret,cursor:null})).rejects.toThrow();
  await expect(administrator.query(api.adminRefresh.studentConnections,{secret:'wrong',cursor:null})).rejects.toThrow();
  const batch=await administrator.query(api.adminRefresh.studentConnections,{secret,cursor:null});expect(batch.students).toHaveLength(1);expect(batch.students[0].accountId).toBe(id);
  const conn=batch.students[0],args={secret,accountId:conn.accountId,connectionId:conn.connectionId,encryptedRefreshToken:conn.encryptedRefreshToken,startedAt:Date.now()+1000};
  await expect(student.mutation(api.adminRefresh.saveStudentSnapshot,{...args,courses:[]})).rejects.toThrow();
  await administrator.mutation(api.adminRefresh.saveStudentSnapshot,{...args,courses:[{googleCourseId:'c',name:'Math',section:'3A',workAvailable:true,weeklyCounts:[{start:'2026-11-09',count:2}]}]});
  const snapshots=await t.run(ctx=>ctx.db.query('classroomSnapshots').collect());expect(snapshots[0].work).toEqual([]);expect(snapshots[0].weeklyCounts).toEqual([{start:'2026-11-09',count:2}]);
  await administrator.mutation(api.adminRefresh.markStudentUnavailable,args);expect((await t.run(ctx=>ctx.db.query('classroomSnapshots').collect()))[0].workAvailable).toBe(false);
  await student.mutation(api.classroom.removeConnection,{});await expect(administrator.mutation(api.adminRefresh.saveStudentSnapshot,{...args,courses:[]})).rejects.toThrow();expect(await t.run(ctx=>ctx.db.query('classroomSnapshots').collect())).toEqual([]);
 });
 it('does not overwrite snapshots created after refresh started',async()=>{
  process.env.CLASSROOM_SYNC_SECRET=secret;const t=createTest();await t.run(async ctx=>{for(const [uid,role] of [['admin','admin'],['s','student']] as const)await ctx.db.insert('accounts',{firebaseUid:uid,email:`${uid}@lspu.edu.ph`,name:uid,role,active:true})});const student=t.withIdentity(ident('s')),administrator=t.withIdentity(ident('admin'));
  await student.mutation(api.classroom.saveConnection,{encryptedRefreshToken:'v1.cipher'});const conn=(await administrator.query(api.adminRefresh.studentConnections,{secret,cursor:null})).students[0];
  await student.mutation(api.classroom.syncSnapshot,{secret,courses:[{googleCourseId:'new',name:'New',workAvailable:true,weeklyCounts:[],work:[]}]});
  await administrator.mutation(api.adminRefresh.saveStudentSnapshot,{secret,accountId:conn.accountId,connectionId:conn.connectionId,encryptedRefreshToken:conn.encryptedRefreshToken,startedAt:1,courses:[{googleCourseId:'old',name:'Old',workAvailable:true,weeklyCounts:[]}]});
  expect((await t.run(ctx=>ctx.db.query('classroomSnapshots').collect())).map(s=>s.name)).toEqual(['New']);
 });
});
