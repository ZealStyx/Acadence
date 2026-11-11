import {queryGeneric,mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount,normalizeEmail} from './access';
import {weekStart,addDays} from './calculations';
import {BATCH,TERM,sections,counts,assessmentsFor,additionalShowcaseSections} from './pitchData';
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
// Reference dates are safe for authenticated pitch participants; no credentials are exposed.
export const pitchWindow=queryGeneric({args:{},handler:async ctx=>{await requireAccount(ctx);const batch=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();return batch?{referenceMonday:batch.referenceMonday,term:batch.term}:null;}});
export const status=queryGeneric({args:{},handler:async ctx=>{await requireAccount(ctx,'admin');if(process.env.PITCH_DEMO_ENABLED!=='true')return {enabled:false,batch:null,counts};const batch=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();return {batch,counts,enabled:true};}});
export const preview=queryGeneric({args:{instructorEmail:v.string(),studentEmail:v.string(),referenceMonday:v.optional(v.string())},handler:async(ctx,args)=>{await auth(ctx);const {student}=await validate(ctx,args.instructorEmail,args.studentEmail);if(args.referenceMonday&&weekStart(args.referenceMonday)!==args.referenceMonday)throw new Error('Reference date must be a Monday.');return {...counts,syntheticStudents:counts.students-(student?1:0),realStudents:student?1:0,term:TERM};}});
export const seed=mutationGeneric({args:{instructorEmail:v.string(),studentEmail:v.string(),referenceMonday:v.optional(v.string()),confirmation:v.string()},handler:async(ctx,args)=>{
 await auth(ctx);if(args.confirmation!=='SEED_ACADENCE_PITCH_DEMO')throw new Error('Incorrect seed confirmation.');const {teacher,student}=await validate(ctx,args.instructorEmail,args.studentEmail);
 const existing=await ctx.db.query('demoBatches').withIndex('by_key',q=>q.eq('key',BATCH)).unique();if(existing){if(existing.instructorId!==teacher._id||existing.studentId!==student?._id)throw new Error('Existing batch has different accounts. Reset it before changing configuration.');let updated=0;
  const matches=(await ctx.db.query('accounts').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect()).filter(a=>a.demoEntityKey==='instructor:2');if(matches.length>1)throw new Error('Duplicate demo instructor; no assignments were updated.');
  let coInstructor=matches[0];if(!coInstructor){const email='pitch-169@demo.invalid';if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique())throw new Error('Demo instructor email already exists. No assignments were updated.');const id=await ctx.db.insert('accounts',{...mark('instructor:2'),email,name:'Demo Instructor CCS',role:'instructor',active:true});coInstructor=(await ctx.db.get(id))!;}
  if(coInstructor.firebaseUid||coInstructor.role!=='instructor'||!coInstructor.active)throw new Error('Demo instructor is no longer available. No assignments were updated.');
  const demoCourses=await ctx.db.query('courses').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect();
  for(const j of [2,3]){const target=demoCourses.filter(c=>c.demoEntityKey===`course:2:${j}`);if(target.length!==1)throw new Error('Demo course is missing or duplicated; no assignments were updated.');const course=target[0];if(course.instructorId===coInstructor._id)continue;if(course.instructorId!==teacher._id)throw new Error('Demo course owner changed; no assignments were updated.');await ctx.db.patch(course._id,{instructorId:coInstructor._id});updated++;}
  for(const index of additionalShowcaseSections){const target=(await ctx.db.query('courses').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect()).filter(c=>c.demoEntityKey===`course:${index}:0`);if(target.length!==1)throw new Error('Demo course is missing or duplicated; resolve the batch before updating.');const course=target[0];if(course.instructorId===teacher._id)continue;const owner=await ctx.db.get(course.instructorId);if(!owner||owner.demoBatchKey!==BATCH||owner.demoEntityKey!==`instructor:${index}`)throw new Error('Demo course owner changed; no assignments were updated.');await ctx.db.patch(course._id,{instructorId:teacher._id});updated++;}
  // Extend only this marked batch. Existing offerings and deadlines are never overwritten.
  const batchSections=await ctx.db.query('academicSections').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect();
  const batchAccounts=await ctx.db.query('accounts').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect();
  const batchAssessments=await ctx.db.query('assessments').withIndex('by_demo_batch',q=>q.eq('demoBatchKey',BATCH)).collect();
  for(let index=0;index<sections.length;index++){
   const sectionMatches=batchSections.filter(s=>s.demoEntityKey===`section:${index}`), owners=batchAccounts.filter(a=>a.demoEntityKey===`instructor:${index}`);
   if(sectionMatches.length!==1||owners.length!==1||owners[0].role!=='instructor'||!owners[0].active||owners[0].firebaseUid)throw new Error('Demo section or instructor is unavailable; no data was updated.');
   const s=sections[index];
   for(let j=4;j<s.subjects.length;j++){
    const key=`course:${index}:${j}`, matches=demoCourses.filter(c=>c.demoEntityKey===key);
    if(matches.length>1)throw new Error('Duplicate demo course; no data was updated.');
    let course=matches[0];
    if(course&&(course.academicSectionId!==sectionMatches[0]._id||course.subject!==s.subjects[j]))throw new Error('Demo course changed; no data was updated.');
    if(!course){const id=await ctx.db.insert('courses',{...mark(key),subject:s.subjects[j],name:`Illustrative ${s.subjects[j]} (pitch demo)`,program:s.program,yearLevel:s.year,instructorId:owners[0]._id,academicSectionId:sectionMatches[0]._id});course=(await ctx.db.get(id))!;updated++;}
    const assessmentKey=`extra-assessment:${index}:${j}`, existingAssessments=batchAssessments.filter(a=>a.demoEntityKey===assessmentKey);
    if(existingAssessments.length>1||existingAssessments.some(a=>a.courseId!==course._id))throw new Error('Demo assessment changed; no data was updated.');
    if(!existingAssessments.length){await ctx.db.insert('assessments',{...mark(assessmentKey),courseId:course._id,title:'Course activity',type:'activity',dueDate:addDays(existing.referenceMonday,((j+index)%8)*7+(j%5)),weightPercent:5,major:false,createdBy:course.instructorId,updatedAt:Date.now()});updated++;}
   }
  }
  return {created:false,updated,referenceMonday:existing.referenceMonday,...counts};}
 const monday=args.referenceMonday||weekStart(new Date().toISOString().slice(0,10));if(weekStart(monday)!==monday)throw new Error('Reference date must be a Monday.');
 // Never adopt or overwrite a real record on a natural-key collision.
 for(const s of sections){const matches=await ctx.db.query('academicSections').withIndex('by_code_term',q=>q.eq('code',s.code)).collect();if(matches.some(x=>x.term===TERM))throw new Error(`Section ${s.code} already exists for this term. Use a separate deployment.`);}
 for(let i=1;i<=169;i++){const email=`pitch-${String(i).padStart(3,'0')}@demo.invalid`;if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique())throw new Error('Demo email already exists. No data was written.');}
 await ctx.db.insert('demoBatches',{key:BATCH,referenceMonday:monday,term:TERM,instructorId:teacher._id,...(student?{studentId:student._id}:{}),createdAt:Date.now()});
 let number=0,instructorNumber=160;
 for(let index=0;index<sections.length;index++){
  const s=sections[index];const sectionId=await ctx.db.insert('academicSections',{...mark(`section:${index}`),code:s.code,program:s.program,yearLevel:s.year,term:TERM});
  const instructorId=await ctx.db.insert('accounts',{...mark(`instructor:${index}`),email:index===2?'pitch-169@demo.invalid':`pitch-${String(++instructorNumber).padStart(3,'0')}@demo.invalid`,name:`Demo Instructor ${s.college}`,role:'instructor',active:true});
  for(let j=0;j<s.size;j++){
   const useReal=index===2&&j===0&&student;const id=useReal?student._id:await ctx.db.insert('accounts',{...mark(`student:${index}:${j}`),email:`pitch-${String(++number).padStart(3,'0')}@demo.invalid`,name:`Demo Student ${String(number).padStart(3,'0')}`,role:'student',active:true,program:s.program,yearLevel:s.year});
   await ctx.db.insert('sectionMembers',{...mark(`member:${index}:${j}`),studentId:id,academicSectionId:sectionId});
  }
  const courseIds:Id<'courses'>[]=[];const courseInstructors:Id<'accounts'>[]=[];for(let j=0;j<s.subjects.length;j++){const owner=(index===2&&j<2)||(additionalShowcaseSections.some(i=>i===index)&&j===0)?teacher._id:instructorId;courseInstructors.push(owner);courseIds.push(await ctx.db.insert('courses',{...mark(`course:${index}:${j}`),subject:s.subjects[j],name:`Illustrative ${s.subjects[j]} (pitch demo)`,program:s.program,yearLevel:s.year,instructorId:owner,academicSectionId:sectionId}));}
  for(let j=4;j<s.subjects.length;j++)await ctx.db.insert('assessments',{...mark(`extra-assessment:${index}:${j}`),courseId:courseIds[j],title:'Course activity',type:'activity',dueDate:addDays(monday,((j+index)%8)*7+(j%5)),weightPercent:5,major:false,createdBy:courseInstructors[j],updatedAt:Date.now()});
  let n=0;for(const item of assessmentsFor(index))await ctx.db.insert('assessments',{...mark(`assessment:${index}:${n++}`),courseId:courseIds[item.course],title:item.title,type:item.type,dueDate:addDays(monday,item.week*7+item.day),weightPercent:item.weightPercent,major:item.major,createdBy:courseInstructors[item.course],updatedAt:Date.now()});
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
