import {describe,it,expect} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as classroom from '../convex/classroom';
const {api,createTest}=defineTestApp({schema}).defineModules({classroom});
const identity=(uid:string)=>({subject:uid,tokenIdentifier:`firebase|${uid}`,email:`${uid}@lspu.edu.ph`});

describe('student Classroom cache isolation',()=>{
 it('limits selected published work to its owner and rejects unauthorized access',async()=>{
  const t=createTest();
  const {courseA,courseB}=await t.run(async ctx=>{
   const a=await ctx.db.insert('accounts',{firebaseUid:'alice',email:'alice@lspu.edu.ph',name:'Alice',role:'student',active:true});
   const b=await ctx.db.insert('accounts',{firebaseUid:'bob',email:'bob@lspu.edu.ph',name:'Bob',role:'student',active:true});
   await ctx.db.insert('accounts',{firebaseUid:'teacher',email:'teacher@lspu.edu.ph',name:'Teacher',role:'instructor',active:true});
   const courseA=await ctx.db.insert('classroomStudentCourses',{ownerId:a,googleCourseId:'c1',name:'Course A',selected:true});
   const courseB=await ctx.db.insert('classroomStudentCourses',{ownerId:b,googleCourseId:'c1',name:'Course B',selected:true});
   for(const [ownerId,title,state] of [[a,'Published','PUBLISHED'],[a,'Draft','DRAFT'],[a,'Deleted','DELETED'],[b,'Bob only','PUBLISHED']] as const){await ctx.db.insert('classroomStudentWork',{ownerId,googleCourseId:'c1',googleCourseWorkId:title,title,state,updatedAt:1})}
   return {courseA,courseB};
  });
  const alice=t.withIdentity(identity('alice')),bob=t.withIdentity(identity('bob'));
  expect((await alice.query(api.classroom.studentCourses,{})).map(c=>c.name)).toEqual(['Course A']);
  expect((await alice.query(api.classroom.studentWork,{})).map(w=>w.title)).toEqual(['Published']);
  expect((await bob.query(api.classroom.studentWork,{})).map(w=>w.title)).toEqual(['Bob only']);
  await expect(alice.mutation(api.classroom.selectStudentCourse,{courseId:courseB,selected:false})).rejects.toThrow();
  await expect(t.query(api.classroom.studentWork,{})).rejects.toThrow();
  await expect(t.withIdentity(identity('teacher')).query(api.classroom.studentWork,{})).rejects.toThrow();
  await alice.mutation(api.classroom.selectStudentCourse,{courseId:courseA,selected:false});
  expect(await alice.query(api.classroom.studentWork,{})).toEqual([]);
  expect((await bob.query(api.classroom.studentWork,{})).map(w=>w.title)).toEqual(['Bob only']);
 });
});

describe('saved Classroom connection authorization',()=>{
 it('keeps encrypted credentials scoped to the authenticated active student',async()=>{
  const t=createTest();
  await t.run(async ctx=>{
   for(const uid of ['alice','bob'])await ctx.db.insert('accounts',{firebaseUid:uid,email:`${uid}@lspu.edu.ph`,name:uid,role:'student',active:true});
   await ctx.db.insert('accounts',{firebaseUid:'teacher',email:'teacher@lspu.edu.ph',name:'teacher',role:'instructor',active:true});
  });
  const alice=t.withIdentity(identity('alice')),bob=t.withIdentity(identity('bob'));
  await alice.mutation(api.classroom.saveConnection,{encryptedRefreshToken:'v1.encrypted'});
  expect(await alice.query(api.classroom.connection,{})).toEqual({encryptedRefreshToken:'v1.encrypted'});
  expect(await bob.query(api.classroom.connection,{})).toBeNull();
  await bob.mutation(api.classroom.removeConnection,{});
  expect(await alice.query(api.classroom.connection,{})).not.toBeNull();
  await expect(t.query(api.classroom.connection,{})).rejects.toThrow();
  expect(await t.withIdentity(identity('teacher')).query(api.classroom.connection,{})).toBeNull();
  await alice.mutation(api.classroom.removeConnection,{});
  expect(await alice.query(api.classroom.connection,{})).toBeNull();
 });
});

describe('instructor Classroom reviews',()=>{
 it('stores teacher decisions privately and allows revisions',async()=>{
  const t=createTest();await t.run(async ctx=>{for(const uid of ['teacher','other'])await ctx.db.insert('accounts',{firebaseUid:uid,email:`${uid}@lspu.edu.ph`,name:uid,role:'instructor',active:true});await ctx.db.insert('accounts',{firebaseUid:'student',email:'student@lspu.edu.ph',name:'student',role:'student',active:true})});
  const teacher=t.withIdentity(identity('teacher')),other=t.withIdentity(identity('other')),student=t.withIdentity(identity('student'));
  const data={googleCourseId:'course',googleCourseWorkId:'work',category:'quiz' as const};
  await teacher.mutation(api.classroom.confirmReview,data);await teacher.mutation(api.classroom.confirmReview,{...data,category:'exam'});
  expect((await teacher.query(api.classroom.reviews,{})).map(r=>r.category)).toEqual(['exam']);
  expect(await other.query(api.classroom.reviews,{})).toEqual([]);
  await expect(student.query(api.classroom.reviews,{})).rejects.toThrow();
  await expect(student.mutation(api.classroom.confirmReview,data)).rejects.toThrow();
 });
});
