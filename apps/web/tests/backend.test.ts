import {describe,it,expect, beforeEach} from 'vitest';
import {defineTestApp} from 'convex-test';
import schema from '../convex/schema';
import * as accounts from '../convex/accounts';
import * as sections from '../convex/sections';
import * as assessments from '../convex/assessments';
import * as student from '../convex/student';
import * as admin from '../convex/admin';
const {api,createTest}=defineTestApp({schema}).defineModules({accounts,sections,assessments,student,admin});
const who=(email:string,verified=true)=>({subject:email,tokenIdentifier:`https://accounts.google.com|${email}`,email,emailVerified:verified,name:email});
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
 it('restricts section mutations and shares official deadline updates with enrolled students',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await root.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Teacher',role:'instructor'});
  const other=await root.mutation(api.accounts.provision,{email:'2222-2222@lspu.edu.ph',name:'Other',role:'instructor'});
  const learner=await root.mutation(api.accounts.provision,{email:'3333-3333@lspu.edu.ph',name:'Student',role:'student',program:'BSIT',yearLevel:1});
  const course=await root.mutation(api.sections.create,{subject:'IT 1',name:'A',program:'BSIT',yearLevel:1,instructorId:teacher});
  await root.mutation(api.sections.enroll,{studentId:learner,courseId:course});await expect(root.mutation(api.sections.enroll,{studentId:learner,courseId:course})).rejects.toThrow();
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph')),outsider=t.withIdentity(who('2222-2222@lspu.edu.ph')),student=t.withIdentity(who('3333-3333@lspu.edu.ph'));
  const fields={courseId:course,title:'Project',type:'performance' as const,dueDate:'2026-12-10',weightPercent:25,major:true};
  await expect(outsider.mutation(api.assessments.create,fields)).rejects.toThrow();await expect(student.mutation(api.assessments.create,fields)).rejects.toThrow();
  const id=await instructor.mutation(api.assessments.create,fields);let timeline=await student.query(api.student.timeline,{});expect(timeline.entries).toHaveLength(1);expect(timeline.weeks[0].load).toBe(5);
  const impact=await instructor.query(api.assessments.collision,{courseId:course,dueDate:'2026-12-10',type:'quiz',weightPercent:0,major:true});expect(impact.current.totalStudents).toBe(1);expect(impact.current.averageLoad).toBe(6);expect(impact.suggestions).toHaveLength(3);
  await instructor.mutation(api.assessments.update,{assessmentId:id,title:'Revised',type:'quiz',dueDate:'2026-12-11',weightPercent:10,major:false});timeline=await student.query(api.student.timeline,{});expect(timeline.entries[0].title).toBe('Revised');
  await instructor.mutation(api.assessments.remove,{assessmentId:id});expect((await student.query(api.student.timeline,{})).entries).toHaveLength(0);
  await expect(t.withIdentity(who('2222-2222@lspu.edu.ph')).query(api.admin.heatmap,{weekStarts:['2026-12-07']})).rejects.toThrow();
  await root.mutation(api.accounts.setActive,{accountId:learner,active:false});await expect(student.query(api.student.timeline,{})).rejects.toThrow();void other;
 });
 it('suppresses small cohorts and rejects invalid dates and unauthorized access',async()=>{
  const t=createTest(),root=t.withIdentity(who('0000-0000@lspu.edu.ph'));await root.mutation(api.accounts.bootstrapAdmin,{});
  const teacher=await root.mutation(api.accounts.provision,{email:'1111-1111@lspu.edu.ph',name:'Instructor',role:'instructor'});
  const course=await root.mutation(api.sections.create,{subject:'IT 1',name:'A',program:'BSIT',yearLevel:1,instructorId:teacher});
  const instructor=t.withIdentity(who('1111-1111@lspu.edu.ph'));
  await expect(instructor.mutation(api.assessments.create,{courseId:course,title:'Task',type:'quiz',dueDate:'2026-02-30',weightPercent:0,major:true})).rejects.toThrow();
  for(let i=1;i<=5;i++){const email=`1234-000${i}@lspu.edu.ph`;const id=await root.mutation(api.accounts.provision,{email,name:'Student',role:'student',program:'BSIT',yearLevel:1});await root.mutation(api.sections.enroll,{studentId:id,courseId:course});if(i===4)expect(await root.query(api.admin.heatmap,{weekStarts:['2026-12-07']})).toHaveLength(0)}
  await instructor.mutation(api.assessments.create,{courseId:course,title:'Quiz',type:'quiz',dueDate:'2026-12-10',weightPercent:0,major:true});
  const heatmap=await root.query(api.admin.heatmap,{weekStarts:['2026-12-07']});expect(heatmap).toHaveLength(1);expect(heatmap[0].studentCount).toBe(5);expect(heatmap[0].weeks[0].averageLoad).toBe(1);
  await expect(root.query(api.admin.heatmap,{weekStarts:['2026-12-08']})).rejects.toThrow();
 });

});
