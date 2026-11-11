import {queryGeneric,mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount,normalizeEmail} from './access';
import {weekStart,addDays} from './calculations';
import {BATCH,TERM,sections,counts,assessmentsFor} from './pitchData';
import type {Id} from './_generated/dataModel';
const flag=()=>{if(process.env.PITCH_DEMO_ENABLED!=='true')throw new Error('Pitch demo is disabled in this Convex deployment.');};
const mark=(key:string)=>({demoBatchKey:BATCH,demoEntityKey:key});
async function auth(ctx:any){await requireAccount(ctx,'admin');flag()}
async function validate(ctx:any,instructorEmail:string,studentEmail:string){
 const teacher=await ctx.db.query('accounts').withIndex('by_email',(q:any)=>q.eq('email',normalizeEmail(instructorEmail))).unique();
 if(!teacher||!teacher.active||teacher.role!=='instructor'||teacher.demoBatchKey)throw new Error('Choose an existing active instructor account. Provision it in Accounts first.');
 const email=normalizeEmail(studentEmail);const student=email?await ctx.db.query('accounts').withIndex('by_email',(q:any)=>q.eq('email',email)).unique():null;
 if(email&&(!student||!student.active||student.role!=='student'||student.demoBatchKey))throw new Error('Choose an existing active student account or leave the field empty.');
 if(student){const membership=await ctx.db.query('sectionMembers').withIndex('by_student',(q:any)=>q.eq('studentId',student._id)).unique();if(membership&&membership.demoBatchKey!==BATCH)throw new Error('Student already has a primary section. Use a separate test account; no membership was changed.');}
 return {teacher,student};
}
export const status=queryGeneric({args:{},handler:async ctx=>{await requireAccount(ctx,'admin');if(process.env.PITCH_DEMO_ENABLED!=='true')return {enabled:false,batch:null,counts};const batch=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();return {batch,counts,enabled:true};}});
export const preview=queryGeneric({args:{instructorEmail:v.string(),studentEmail:v.string(),referenceMonday:v.optional(v.string())},handler:async(ctx,args)=>{await auth(ctx);const {student}=await validate(ctx,args.instructorEmail,args.studentEmail);if(args.referenceMonday&&weekStart(args.referenceMonday)!==args.referenceMonday)throw new Error('Reference date must be a Monday.');return {...counts,syntheticStudents:counts.students-(student?1:0),realStudents:student?1:0,term:TERM};}});
export const seed=mutationGeneric({args:{instructorEmail:v.string(),studentEmail:v.string(),referenceMonday:v.optional(v.string()),confirmation:v.string()},handler:async(ctx,args)=>{
 await auth(ctx);if(args.confirmation!=='SEED_ACADENCE_PITCH_DEMO')throw new Error('Incorrect seed confirmation.');const {teacher,student}=await validate(ctx,args.instructorEmail,args.studentEmail);
 const existing=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();if(existing){if(existing.instructorId!==teacher._id||existing.studentId!==student?._id)throw new Error('Existing batch has different accounts. Reset it before changing configuration.');return {created:false,referenceMonday:existing.referenceMonday,...counts};}
 const monday=args.referenceMonday||weekStart(new Date().toISOString().slice(0,10));if(weekStart(monday)!==monday)throw new Error('Reference date must be a Monday.');
 // Never adopt or overwrite a real record on a natural-key collision.
 for(const s of sections){const matches=await ctx.db.query('academicSections').withIndex('by_code_term',q=>q.eq('code',s.code)).collect();if(matches.some(x=>x.term===TERM))throw new Error(`Section ${s.code} already exists for this term. Use a separate deployment.`);}
 for(let i=1;i<=168;i++){const email=`pitch-${String(i).padStart(3,'0')}@demo.invalid`;if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique())throw new Error('Demo email already exists. No data was written.');}
 await ctx.db.insert('demoBatches',{key:BATCH,referenceMonday:monday,term:TERM,instructorId:teacher._id,...(student?{studentId:student._id}:{}),createdAt:Date.now()});
 let number=0,instructorNumber=160;
 for(let index=0;index<sections.length;index++){
  const s=sections[index];const sectionId=await ctx.db.insert('academicSections',{...mark(`section:${index}`),code:s.code,program:s.program,yearLevel:s.year,term:TERM});
  const instructorId=index===2?teacher._id:await ctx.db.insert('accounts',{...mark(`instructor:${index}`),email:`pitch-${String(++instructorNumber).padStart(3,'0')}@demo.invalid`,name:`Demo Instructor ${s.college}`,role:'instructor',active:true});
  for(let j=0;j<s.size;j++){
   const useReal=index===2&&j===0&&student;const id=useReal?student._id:await ctx.db.insert('accounts',{...mark(`student:${index}:${j}`),email:`pitch-${String(++number).padStart(3,'0')}@demo.invalid`,name:`Demo Student ${String(number).padStart(3,'0')}`,role:'student',active:true,program:s.program,yearLevel:s.year});
   await ctx.db.insert('sectionMembers',{...mark(`member:${index}:${j}`),studentId:id,academicSectionId:sectionId});
  }
  const courseIds:Id<'courses'>[]=[];for(let j=0;j<s.subjects.length;j++)courseIds.push(await ctx.db.insert('courses',{...mark(`course:${index}:${j}`),subject:s.subjects[j],name:`Illustrative ${s.subjects[j]} (pitch demo)`,program:s.program,yearLevel:s.year,instructorId,academicSectionId:sectionId}));
  let n=0;for(const item of assessmentsFor(index))await ctx.db.insert('assessments',{...mark(`assessment:${index}:${n++}`),courseId:courseIds[item.course],title:item.title,type:item.type,dueDate:addDays(monday,item.week*7+item.day),weightPercent:item.weightPercent,major:item.major,createdBy:instructorId,updatedAt:Date.now()});
 }
 return {created:true,referenceMonday:monday,...counts};
}});
export const reset=mutationGeneric({args:{confirmation:v.string()},handler:async(ctx,{confirmation})=>{
 await auth(ctx);if(confirmation!=='DELETE_ACADENCE_PITCH_DEMO')throw new Error('Incorrect reset confirmation.');
 const batch=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();if(!batch)return {deleted:0};
 const allSections=await ctx.db.query('academicSections').collect(),allCourses=await ctx.db.query('courses').collect(),allMembers=await ctx.db.query('sectionMembers').collect(),allAccounts=await ctx.db.query('accounts').collect(),allAssessments=await ctx.db.query('assessments').collect();
 const sections=allSections.filter(x=>x.demoBatchKey===BATCH),courses=allCourses.filter(x=>x.demoBatchKey===BATCH),members=allMembers.filter(x=>x.demoBatchKey===BATCH),accounts=allAccounts.filter(x=>x.demoBatchKey===BATCH),assessments=allAssessments.filter(x=>x.demoBatchKey===BATCH);
 if(accounts.some(a=>a.firebaseUid))throw new Error('Reset blocked: a demo account has a Firebase UID. No data was deleted.');
 const sectionIds=new Set(sections.map(x=>x._id)),courseIds=new Set(courses.map(x=>x._id)),accountIds=new Set(accounts.map(x=>x._id));
 // Refuse to orphan non-demo references instead of deleting them.
 if(allCourses.some(x=>x.demoBatchKey!==BATCH&&(x.academicSectionId&&sectionIds.has(x.academicSectionId)||accountIds.has(x.instructorId)))||allMembers.some(x=>x.demoBatchKey!==BATCH&&(sectionIds.has(x.academicSectionId)||accountIds.has(x.studentId)))||allAssessments.some(x=>x.demoBatchKey!==BATCH&&(courseIds.has(x.courseId)||accountIds.has(x.createdBy)))||(await ctx.db.query('memberships').collect()).some(x=>courseIds.has(x.courseId)||accountIds.has(x.studentId))||(await ctx.db.query('classroomConnections').collect()).some(x=>accountIds.has(x.ownerId))||(await ctx.db.query('classroomSnapshots').collect()).some(x=>accountIds.has(x.ownerId))||(await ctx.db.query('classroomReviews').collect()).some(x=>accountIds.has(x.ownerId)))throw new Error('Reset blocked: non-demo data references demo records. Resolve those references first; no data was deleted.');
 for(const row of assessments)await ctx.db.delete(row._id);for(const row of courses)await ctx.db.delete(row._id);for(const row of members)await ctx.db.delete(row._id);for(const row of sections)await ctx.db.delete(row._id);for(const row of accounts)await ctx.db.delete(row._id);await ctx.db.delete(batch._id);
 return {deleted:assessments.length+courses.length+members.length+sections.length+accounts.length+1};
}});
