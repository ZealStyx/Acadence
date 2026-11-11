import {describe,it,expect, beforeEach} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as accounts from '../convex/accounts';
import * as sections from '../convex/sections';
import * as assessments from '../convex/assessments';
import * as student from '../convex/student';
import * as admin from '../convex/admin';
const {api,createTest}=defineTestApp({schema}).defineModules({accounts,sections,assessments,student,admin});
const who=(email:string,verified=true)=>({subject:email,tokenIdentifier:`https://securetoken.google.com/test-project|${email}`,email,emailVerified:verified,name:email});
beforeEach(()=>{process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL='0000-0000@lspu.edu.ph'});
describe('Convex authorization and shared deadlines',()=>{
 it('requires verified, correctly formatted, provisioned accounts and bootstraps only once',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));
  await expect(t.query(api.accounts.me,{})).rejects.toThrow();
  await expect(t.withIdentity(who('someone@lspu.edu.ph')).query(api.accounts.me,{})).rejects.toThrow();
  await expect(t.withIdentity(who('0000-0000@lspu.edu.ph',false)).mutation(api.accounts.bootstrapAdmin,{})).rejects.toThrow();
  expect((await root.query(api.accounts.status,{})).canBootstrap).toBe(true);
  await root.mutation(api.accounts.bootstrapAdmin,{});expect((await root.query(api.accounts.status,{})).state).toBe('active');await expect(root.mutation(api.accounts.bootstrapAdmin,{})).rejects.toThrow();
  await expect(t.withIdentity(who('1111-1111@lspu.edu.ph')).query(api.accounts.me,{})).rejects.toThrow();
  await expect(root.mutation(api.accounts.provision,{email:'test@lspu.edu.ph',name:'Invalid',role:'student'})).rejects.toThrow();
 });
 it('recognizes valid university email formats and distinguishes missing or unverified email',async()=>{
  const t=createTest();const good=t.withIdentity(who('0324-2225@lspu.edu.ph'));expect((await good.query(api.accounts.status,{})).state).toBe('unapproved');
  const unverified=await t.withIdentity(who('0324-2225@lspu.edu.ph',false)).query(api.accounts.status,{});expect(unverified.state).toBe('invalid');if(unverified.state==='invalid')expect(unverified.reason).toBe('unverified_email');
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
  const fields={courseId:course,title:'Project',type:'performance' as const,dueDate:'2026-12-10',weightPercent:25,major:true};
  await expect(outsider.mutation(api.assessments.create,fields)).rejects.toThrow();await expect(student.mutation(api.assessments.create,fields)).rejects.toThrow();
  const id=await instructor.mutation(api.assessments.create,fields);let timeline=await student.query(api.student.timeline,{});expect(timeline.entries).toHaveLength(1);expect(timeline.weeks[0].load).toBe(5);
  const impact=await instructor.query(api.assessments.collision,{courseId:course,dueDate:'2026-12-10',type:'quiz',weightPercent:0,major:true});expect(impact.unmapped).toBe(false);if(impact.unmapped)throw Error('unmapped');expect(impact.totalStudents).toBe(1);expect(impact.current.load).toBe(6);expect(impact.suggestions).toHaveLength(3);
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
  const user=t.withIdentity({...who('3333-3333@lspu.edu.ph'),subject:'firebase-uid-a'});
  await expect(user.query(api.accounts.me,{})).rejects.toThrow();expect((await user.query(api.accounts.status,{})).canLink).toBe(true);
  expect(await user.mutation(api.accounts.linkApprovedAccount,{})).toBe(record);expect(await user.mutation(api.accounts.linkApprovedAccount,{})).toBe(record);
  const changedEmail=t.withIdentity({...who('9999-9999@lspu.edu.ph'),subject:'firebase-uid-a'});expect((await changedEmail.query(api.accounts.me,{}))._id).toBe(record);
  const impersonator=t.withIdentity({...who('3333-3333@lspu.edu.ph'),subject:'firebase-uid-b',role:'admin'});await expect(impersonator.mutation(api.accounts.linkApprovedAccount,{})).rejects.toThrow();await expect(impersonator.query(api.accounts.me,{})).rejects.toThrow();
  await expect(user.query(api.accounts.list,{})).rejects.toThrow();await expect(t.withIdentity({...who('4444-4444@lspu.edu.ph',false),subject:'new'}).mutation(api.accounts.linkApprovedAccount,{})).rejects.toThrow();
 });

});
