import {describe,it,expect, beforeEach} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as accounts from '../convex/accounts';
import * as sections from '../convex/sections';
import * as assessments from '../convex/assessments';
import * as student from '../convex/student';
import * as admin from '../convex/admin';
import * as instructor from '../convex/instructor';
const {api,createTest}=defineTestApp({schema}).defineModules({accounts,sections,assessments,student,admin,instructor});
const who=(email:string,verified=true)=>({subject:email,tokenIdentifier:`https://securetoken.google.com/test-project|${email}`,email,emailVerified:verified,name:email});
beforeEach(()=>{process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL='0000-0000@lspu.edu.ph'});
describe('Convex authorization and shared deadlines',()=>{
 it('requires a university domain and approved accounts and bootstraps only once',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph',false));
  await expect(t.query(api.accounts.me,{})).rejects.toThrow();
  await expect(t.withIdentity(who('someone@lspu.edu.ph')).query(api.accounts.me,{})).rejects.toThrow();
  expect((await root.query(api.accounts.status,{})).canBootstrap).toBe(true);
  await root.mutation(api.accounts.bootstrapAdmin,{});expect((await root.query(api.accounts.status,{})).state).toBe('active');await expect(root.mutation(api.accounts.bootstrapAdmin,{})).rejects.toThrow();
  await expect(t.withIdentity(who('1111-1111@lspu.edu.ph')).query(api.accounts.me,{})).rejects.toThrow();
  await root.mutation(api.accounts.provision,{email:'test@lspu.edu.ph',name:'Student',role:'student'});
  await expect(root.mutation(api.accounts.provision,{email:'test@lspu.edu.ph.example.com',name:'Invalid',role:'student'})).rejects.toThrow();
 });
 it('automatically creates only a student account for a new university identity',async()=>{
  const t=createTest(),admin=t.withIdentity(who('0000-0000@lspu.edu.ph'));
  await expect(admin.mutation(api.accounts.registerStudent,{})).rejects.toThrow();
  await admin.mutation(api.accounts.bootstrapAdmin,{});
  const student=t.withIdentity(who('new@lspu.edu.ph',false));
  expect((await student.query(api.accounts.status,{})).canRegister).toBe(true);
  const id=await student.mutation(api.accounts.registerStudent,{});
  expect(await student.mutation(api.accounts.registerStudent,{})).toBe(id);
  expect((await student.query(api.accounts.me,{})).role).toBe('student');
  await expect(student.query(api.accounts.list,{})).rejects.toThrow();
  await expect(t.withIdentity(who('bad@example.com')).mutation(api.accounts.registerStudent,{})).rejects.toThrow();
  await admin.mutation(api.accounts.setActive,{accountId:id,active:false});
  await expect(student.mutation(api.accounts.registerStudent,{})).rejects.toThrow();
  const other=t.withIdentity({...who('new@lspu.edu.ph'),subject:'other-uid'});
  await expect(other.mutation(api.accounts.registerStudent,{})).rejects.toThrow();
  await admin.mutation(api.accounts.provision,{email:'teacher@lspu.edu.ph',name:'Teacher',role:'instructor'});
  await expect(t.withIdentity(who('teacher@lspu.edu.ph')).mutation(api.accounts.registerStudent,{})).rejects.toThrow();
 });
 it('allows only the two specified Gmail addresses to register as admins',async()=>{
  const t=createTest();
  for(const email of ['johnalexalcazar@gmail.com','alcazarjohnalex@gmail.com']){
   const account=t.withIdentity(who(email));
   expect((await account.query(api.accounts.status,{})).canRegister).toBe(true);
   const id=await account.mutation(api.accounts.registerStudent,{});
   expect((await account.query(api.accounts.me,{})).role).toBe('admin');
   expect(await account.query(api.accounts.list,{})).toBeDefined();
   await expect(t.withIdentity({...who(email),subject:'different-uid'}).mutation(api.accounts.registerStudent,{})).rejects.toThrow();
   await expect(account.mutation(api.accounts.setActive,{accountId:id,active:false})).rejects.toThrow();
  }
  for(const email of ['someone@gmail.com','johnalexalcazar@gmail.com.example.com']){
   const other=t.withIdentity(who(email));
   expect((await other.query(api.accounts.status,{})).state).toBe('invalid');
   await expect(other.mutation(api.accounts.registerStudent,{})).rejects.toThrow();
  }
 });
 it('lets only administrators switch student and instructor roles',async()=>{
  const t=createTest(),admin=t.withIdentity(who('johnalexalcazar@gmail.com'));
  const adminId=await admin.mutation(api.accounts.registerStudent,{});
  const student=t.withIdentity(who('role-test@lspu.edu.ph'));
  const id=await student.mutation(api.accounts.registerStudent,{});
  await expect(student.mutation(api.accounts.setTeachingRole,{accountId:id,role:'instructor'})).rejects.toThrow();
  await admin.mutation(api.accounts.setTeachingRole,{accountId:id,role:'instructor'});
  expect((await student.query(api.accounts.me,{})).role).toBe('instructor');
  await admin.mutation(api.accounts.setTeachingRole,{accountId:id,role:'student'});
  expect((await student.query(api.accounts.me,{})).role).toBe('student');
  await expect(admin.mutation(api.accounts.setTeachingRole,{accountId:adminId,role:'student'})).rejects.toThrow();
 });
 it('allows users to update only their own profile',async()=>{
  const t=createTest(),a=t.withIdentity(who('a@lspu.edu.ph')),b=t.withIdentity(who('b@lspu.edu.ph'));
  await a.mutation(api.accounts.registerStudent,{});await b.mutation(api.accounts.registerStudent,{});
  await a.mutation(api.accounts.updateProfile,{name:'  Alice  ',contact:' 12345 '});
  expect((await a.query(api.accounts.me,{})).name).toBe('Alice');expect((await a.query(api.accounts.me,{})).contact).toBe('12345');
  expect((await b.query(api.accounts.me,{})).name).toBe('b@lspu.edu.ph');
  await a.mutation(api.accounts.setAccessibility,{largerText:true,reducedMotion:true});expect((await a.query(api.accounts.me,{})).largerText).toBe(true);expect((await b.query(api.accounts.me,{})).largerText).toBeUndefined();
  await expect(a.mutation(api.accounts.updateProfile,{name:' ',contact:''})).rejects.toThrow();
  await expect(t.mutation(api.accounts.updateProfile,{name:'Bad',contact:''})).rejects.toThrow();
 });
 it('restricts instructor overview and includes section-wide deadlines and type-filtered admin heatmap',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const tid=await root.mutation(api.accounts.provision,{email:'teacher@lspu.edu.ph',name:'Teacher',role:'instructor'});
  const sid=await root.mutation(api.accounts.provision,{email:'stranger@lspu.edu.ph',name:'Student',role:'student'});
  const section=await root.mutation(api.sections.createAcademic,{code:'3IS1',program:'BSIT',yearLevel:3,term:'Term 1'});
  const course=await root.mutation(api.sections.create,{academicSectionId:section,instructorId:tid,subject:'IT1',name:'Subject'});
  for(let i=0;i<5;i++){const id=await root.mutation(api.accounts.provision,{email:`member${i}@lspu.edu.ph`,name:'Member',role:'student'});await root.mutation(api.sections.enroll,{studentId:id,academicSectionId:section});}
  const teacher=t.withIdentity(who('teacher@lspu.edu.ph'));await teacher.mutation(api.accounts.linkApprovedAccount,{});
  await teacher.mutation(api.assessments.create,{courseId:course,title:'Quiz',type:'quiz',dueDate:'2026-12-08',weightPercent:0,major:false});
  await teacher.mutation(api.assessments.create,{courseId:course,title:'Exam',type:'exam',dueDate:'2026-12-09',weightPercent:0,major:true});
  const data=await teacher.query(api.instructor.overview,{weekStarts:['2026-12-07']});
  expect(data[0].studentCount).toBe(5);expect(data[0].weeks[0].load).toBe(4);expect(data[0].entries).toHaveLength(2);
  const filtered=await root.query(api.admin.heatmap,{weekStarts:['2026-12-07'],type:'exam'});expect(filtered[0].weeks[0].averageLoad).toBe(3);
  const learner=t.withIdentity(who('stranger@lspu.edu.ph'));await learner.mutation(api.accounts.linkApprovedAccount,{});
  await expect(learner.query(api.instructor.overview,{weekStarts:['2026-12-07']})).rejects.toThrow();
  await expect(teacher.query(api.admin.heatmap,{weekStarts:['2026-12-07']})).rejects.toThrow();
  expect(sid).toBeDefined();
 });
 it('accepts university emails without a verification flag and rejects other domains',async()=>{
  const t=createTest();const good=t.withIdentity(who('0324-2225@lspu.edu.ph'));expect((await good.query(api.accounts.status,{})).state).toBe('unapproved');
  const unverified=await t.withIdentity(who('0324-2225@lspu.edu.ph',false)).query(api.accounts.status,{});expect(unverified.state).toBe('unapproved');
  const missingVerification=await t.withIdentity({subject:'another',tokenIdentifier:'https://securetoken.google.com/test-project|another',email:'name@lspu.edu.ph'}).query(api.accounts.status,{});expect(missingVerification.state).toBe('unapproved');
  for(const email of ['@lspu.edu.ph','person@lspu.edu.ph.example.com','person@sub.lspu.edu.ph','person@@lspu.edu.ph'])expect((await t.withIdentity(who(email)).query(api.accounts.status,{})).state).toBe('invalid');
  const bad=await t.withIdentity(who('0324-2225@example.com')).query(api.accounts.status,{});expect(bad.state).toBe('invalid');if(bad.state==='invalid')expect(bad.reason).toBe('invalid_format');
  const missing=await t.withIdentity({subject:'firebase-uid',tokenIdentifier:'https://securetoken.google.com/test-project|firebase-uid'}).query(api.accounts.status,{});expect(missing.state).toBe('invalid');if(missing.state==='invalid')expect(missing.reason).toBe('missing_email');
 });
 it('restricts section mutations and shares official deadline updates with enrolled students',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await root.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Teacher',role:'instructor'});
  const other=await root.mutation(api.accounts.provision,{email:'2222-2222@lspu.edu.ph',name:'Other',role:'instructor'});
  const learner=await root.mutation(api.accounts.provision,{email:'3333-3333@lspu.edu.ph',name:'Student',role:'student',program:'BSIT',yearLevel:1});
  const cohort=await root.mutation(api.sections.createAcademic,{code:'3IS1',program:'BSIT',yearLevel:1,term:'2026 T1'});
  const course=await root.mutation(api.sections.create,{subject:'IT 1',name:'A',academicSectionId:cohort,instructorId:teacher});
  await root.mutation(api.sections.enroll,{studentId:learner,academicSectionId:cohort});await expect(root.mutation(api.sections.enroll,{studentId:learner,academicSectionId:cohort})).rejects.toThrow();
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph')),outsider=t.withIdentity(who('2222-2222@lspu.edu.ph')),student=t.withIdentity(who('3333-3333@lspu.edu.ph'));
  await instructor.mutation(api.accounts.linkApprovedAccount,{});await outsider.mutation(api.accounts.linkApprovedAccount,{});await student.mutation(api.accounts.linkApprovedAccount,{});
  const fields={courseId:course,title:'Project',type:'activity' as const,dueDate:'2026-12-10',weightPercent:25,major:true};
  await expect(outsider.mutation(api.assessments.create,fields)).rejects.toThrow();await expect(student.mutation(api.assessments.create,fields)).rejects.toThrow();
  await expect(instructor.mutation(api.assessments.create,{...fields,type:'performance'})).rejects.toThrow();
  const id=await instructor.mutation(api.assessments.create,fields);let timeline=await student.query(api.student.timeline,{});expect(timeline.entries).toHaveLength(1);expect(timeline.weeks[0].load).toBe(2.5);
  const impact=await instructor.query(api.assessments.collision,{courseId:course,dueDate:'2026-12-10',type:'quiz',weightPercent:0,major:true});expect(impact.unmapped).toBe(false);if(impact.unmapped)throw Error('unmapped');expect(impact.totalStudents).toBe(1);expect(impact.current.load).toBe(3.5);expect(impact.suggestions).toHaveLength(3);
  await instructor.mutation(api.assessments.update,{assessmentId:id,title:'Revised',type:'quiz',dueDate:'2026-12-11',weightPercent:10,major:false});timeline=await student.query(api.student.timeline,{});expect(timeline.entries[0].title).toBe('Revised');
  await instructor.mutation(api.assessments.remove,{assessmentId:id});expect((await student.query(api.student.timeline,{})).entries).toHaveLength(0);
  await expect(t.withIdentity(who('2222-2222@lspu.edu.ph')).query(api.admin.heatmap,{weekStarts:['2026-12-07']})).rejects.toThrow();
  await root.mutation(api.accounts.setActive,{accountId:learner,active:false});await expect(student.query(api.student.timeline,{})).rejects.toThrow();void other;
 });
 it('suppresses small cohorts and rejects invalid dates and unauthorized access',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await root.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Instructor',role:'instructor'});
  const cohort=await root.mutation(api.sections.createAcademic,{code:'3IS1',program:'BSIT',yearLevel:1,term:'2026 T1'});
  const course=await root.mutation(api.sections.create,{subject:'IT 1',name:'A',academicSectionId:cohort,instructorId:teacher});
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph'));await instructor.mutation(api.accounts.linkApprovedAccount,{});
  await expect(instructor.mutation(api.assessments.create,{courseId:course,title:'Task',type:'quiz',dueDate:'2026-02-30',weightPercent:0,major:true})).rejects.toThrow();
  for(let i=1;i<=5;i++){const email=`1234-000${i}@lspu.edu.ph`;const id=await root.mutation(api.accounts.provision,{email,name:'Student',role:'student',program:'BSIT',yearLevel:1});await root.mutation(api.sections.enroll,{studentId:id,academicSectionId:cohort});if(i===4)expect(await root.query(api.admin.heatmap,{weekStarts:['2026-12-07']})).toHaveLength(0)}
  await instructor.mutation(api.assessments.create,{courseId:course,title:'Quiz',type:'quiz',dueDate:'2026-12-10',weightPercent:0,major:true});
  const heatmap=await root.query(api.admin.heatmap,{weekStarts:['2026-12-07']});expect(heatmap).toHaveLength(1);expect(heatmap[0].studentCount).toBe(5);expect(heatmap[0].weeks[0].averageLoad).toBe(1);
  await expect(root.query(api.admin.heatmap,{weekStarts:['2026-12-08']})).rejects.toThrow();
 });

 it('uses one shared section schedule regardless of legacy course enrollments and keeps sections separate',async()=>{
  const t=createTest(),admin=t.withIdentity(who('0000-0000@lspu.edu.ph'));await admin.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await admin.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Teacher',role:'instructor'});
  const a=await admin.mutation(api.accounts.provision,{email:'1234-0001@lspu.edu.ph',name:'Student A',role:'student'}),b=await admin.mutation(api.accounts.provision,{email:'1234-0002@lspu.edu.ph',name:'Student B',role:'student'}),c=await admin.mutation(api.accounts.provision,{email:'1234-0003@lspu.edu.ph',name:'Student C',role:'student'});
  const first=await admin.mutation(api.sections.createAcademic,{code:'3IS1',program:'BSIT',yearLevel:3,term:'2026 T1'}), second=await admin.mutation(api.sections.createAcademic,{code:'3IS2',program:'BSIT',yearLevel:3,term:'2026 T1'});
  await expect(admin.mutation(api.sections.createAcademic,{code:'3is1',program:'BSIT',yearLevel:3,term:'2026 T1'})).rejects.toThrow();
  const course1=await admin.mutation(api.sections.create,{subject:'IT 1',name:'First',academicSectionId:first,instructorId:teacher}),course2=await admin.mutation(api.sections.create,{subject:'IT 2',name:'Second',academicSectionId:first,instructorId:teacher}),other=await admin.mutation(api.sections.create,{subject:'IT 1',name:'Other',academicSectionId:second,instructorId:teacher});
  for(const id of [a,b])await admin.mutation(api.sections.enroll,{studentId:id,academicSectionId:first});await admin.mutation(api.sections.enroll,{studentId:c,academicSectionId:second});await expect(admin.mutation(api.sections.enroll,{studentId:a,academicSectionId:second})).rejects.toThrow();
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph'));await instructor.mutation(api.accounts.linkApprovedAccount,{});for(const email of ['1234-0001@lspu.edu.ph','1234-0002@lspu.edu.ph','1234-0003@lspu.edu.ph'])await t.withIdentity(who(email)).mutation(api.accounts.linkApprovedAccount,{});const draft={title:'Task',type:'quiz' as const,dueDate:'2026-12-10',weightPercent:0,major:true};
  await instructor.mutation(api.assessments.create,{...draft,courseId:course1});await instructor.mutation(api.assessments.create,{...draft,title:'Second task',courseId:course2});await instructor.mutation(api.assessments.create,{...draft,title:'Other section',courseId:other});
  await t.run(async ctx=>{await ctx.db.insert('memberships',{studentId:a,courseId:other})});
  const one=await t.withIdentity(who('1234-0001@lspu.edu.ph')).query(api.student.timeline,{}),two=await t.withIdentity(who('1234-0002@lspu.edu.ph')).query(api.student.timeline,{}),three=await t.withIdentity(who('1234-0003@lspu.edu.ph')).query(api.student.timeline,{});
  expect(one.entries.map(d=>d.title)).toEqual(two.entries.map(d=>d.title));expect(one.weeks[0].load).toBe(2);expect(two.weeks[0].load).toBe(2);expect(one.adjustments.map(d=>d.title)).toEqual(['Other section']);expect(two.adjustments).toHaveLength(0);expect(three.entries.map(d=>d.title)).toEqual(['Other section']);
  const impact=await instructor.query(api.assessments.collision,{courseId:course1,dueDate:draft.dueDate,type:'quiz',weightPercent:0,major:true});if(impact.unmapped)throw Error('unmapped');expect(impact.current.sharedDeadlineCount).toBe(3);expect(impact.current.load).toBe(3);expect(impact.totalStudents).toBe(2);expect(impact.offerings).toHaveLength(2);
 });
 it('preserves unmapped legacy courses without guessing section membership',async()=>{
  const t=createTest(),admin=t.withIdentity(who('0000-0000@lspu.edu.ph'));await admin.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await admin.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Teacher',role:'instructor'}), learner=await admin.mutation(api.accounts.provision,{email:'1234-0001@lspu.edu.ph',name:'Student',role:'student'});
  const old=await t.run(async ctx=>{const courseId=await ctx.db.insert('courses',{subject:'IT 1',name:'A',program:'BSIT',yearLevel:1,instructorId:teacher});await ctx.db.insert('memberships',{courseId,studentId:learner});return courseId});
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph'));await instructor.mutation(api.accounts.linkApprovedAccount,{});await t.withIdentity(who('1234-0001@lspu.edu.ph')).mutation(api.accounts.linkApprovedAccount,{});await instructor.mutation(api.assessments.create,{courseId:old,title:'Old deadline',type:'quiz',dueDate:'2026-12-10',weightPercent:0,major:true});expect((await instructor.query(api.assessments.collision,{courseId:old,dueDate:'2026-12-10',type:'quiz',weightPercent:0,major:true})).unmapped).toBe(true);
  const student=t.withIdentity(who('1234-0001@lspu.edu.ph'));expect((await student.query(api.student.timeline,{})).adjustments).toHaveLength(1);const cohort=await admin.mutation(api.sections.createAcademic,{code:'3IS1',program:'BSIT',yearLevel:1,term:'2026 T1'});await admin.mutation(api.sections.mapLegacy,{courseId:old,academicSectionId:cohort});await admin.mutation(api.sections.enroll,{studentId:learner,academicSectionId:cohort});const data=await student.query(api.student.timeline,{});expect(data.entries).toHaveLength(1);expect(data.adjustments).toHaveLength(0);
 });

 it('links a preapproved email once and authorizes by Firebase UID rather than changing email or browser claims',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const record=await root.mutation(api.accounts.provision,{email:'3333-3333@lspu.edu.ph',name:'Student',role:'student'});
  const user=t.withIdentity({...who('3333-3333@lspu.edu.ph',false),subject:'firebase-uid-a'});
  await expect(user.query(api.accounts.me,{})).rejects.toThrow();expect((await user.query(api.accounts.status,{})).canLink).toBe(true);
  expect(await user.mutation(api.accounts.linkApprovedAccount,{})).toBe(record);expect(await user.mutation(api.accounts.linkApprovedAccount,{})).toBe(record);
  const changedEmail=t.withIdentity({...who('9999-9999@lspu.edu.ph'),subject:'firebase-uid-a'});expect((await changedEmail.query(api.accounts.me,{}))._id).toBe(record);
  const outside=t.withIdentity({...who('student@example.com'),subject:'firebase-uid-a'});expect((await outside.query(api.accounts.status,{})).state).toBe('invalid');await expect(outside.query(api.accounts.me,{})).rejects.toThrow();
  const impersonator=t.withIdentity({...who('3333-3333@lspu.edu.ph'),subject:'firebase-uid-b',role:'admin'});await expect(impersonator.mutation(api.accounts.linkApprovedAccount,{})).rejects.toThrow();await expect(impersonator.query(api.accounts.me,{})).rejects.toThrow();
  await expect(user.query(api.accounts.list,{})).rejects.toThrow();await expect(t.withIdentity({...who('4444-4444@lspu.edu.ph',false),subject:'new'}).mutation(api.accounts.linkApprovedAccount,{})).rejects.toThrow();
 });

});
