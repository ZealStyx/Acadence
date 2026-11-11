import {queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';
export const heatmap=queryGeneric({args:{weekStarts:v.array(v.string()),type:v.optional(v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')))},handler:async(ctx,{weekStarts,type})=>{
 await requireAccount(ctx,'admin');if(weekStarts.length<1||weekStarts.length>20||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 20 Monday week starts.');
 const sections=await ctx.db.query('academicSections').collect();const results=await Promise.all(sections.map(async section=>{
 const members=await ctx.db.query('sectionMembers').withIndex('by_section',q=>q.eq('academicSectionId',section._id)).collect();const students=(await Promise.all(members.map(m=>ctx.db.get(m.studentId)))).filter(s=>s&&s.active&&s.role==='student');if(students.length<5)return null;
 const offerings=await ctx.db.query('courses').withIndex('by_academic_section',q=>q.eq('academicSectionId',section._id)).collect();const entries=(await Promise.all(offerings.map(c=>ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',c._id)).collect()))).flat();return {id:section._id,demoBatchKey:section.demoBatchKey,code:section.code,term:section.term,program:section.program,yearLevel:section.yearLevel,studentCount:students.length,offeringCount:offerings.length,weeks:weekStarts.map(start=>{const load=score(entries.filter(d=>weekStart(d.dueDate)===start&&(!type||d.type===type)));return {start,averageLoad:load,band:band(load)}})};
 }));return results.filter((r):r is NonNullable<typeof r>=>r!==null);
}});

// Connected Classroom snapshots are refreshed by their owners, not by an administrator.
export const classroomOverview=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 await requireAccount(ctx,'admin');if(weekStarts.length<1||weekStarts.length>12||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 12 Monday week starts.');
 const accounts=await ctx.db.query('accounts').collect();const active=new Map(accounts.filter(a=>a.active).map(a=>[a._id,a]));
 const snapshots=(await ctx.db.query('classroomSnapshots').collect()).filter(s=>active.get(s.ownerId)?.role===s.role);
 const teachers=snapshots.filter(s=>s.role==='instructor');const students=snapshots.filter(s=>s.role==='student');
 const reviews=await ctx.db.query('classroomReviews').collect();
 // Deduplicate co-teachers' snapshots by Google course/work ID. Only confirmed,
 // published, course-wide work with a due date contributes to a subject's workload.
 const subjects=new Map<string,{id:string;name:string;section:string;state:string;instructors:Set<string>;syncedAt:number;workAvailable:boolean;work:Map<string,{id:string;title:string;dueDate:string;type:'quiz'|'activity'|'exam';reviewedAt:number}>}>();
 for(const c of teachers){
  let subject=subjects.get(c.googleCourseId);if(!subject){subject={id:c.googleCourseId,name:c.name,section:c.section||'',state:c.courseState||'UNKNOWN',instructors:new Set(),syncedAt:c.syncedAt,workAvailable:false,work:new Map()};subjects.set(c.googleCourseId,subject)}
  const owner=active.get(c.ownerId);if(owner)subject.instructors.add(owner.name);subject.syncedAt=Math.max(subject.syncedAt,c.syncedAt);subject.workAvailable||=c.workAvailable;
  if(!c.workAvailable)continue;
  for(const w of c.work){if(!w.dueDate||weekStartSafe(w.dueDate)===null||w.assigneeMode!=='ALL_STUDENTS')continue;
   const r=reviews.find(r=>r.ownerId===c.ownerId&&r.googleCourseId===c.googleCourseId&&r.googleCourseWorkId===w.googleCourseWorkId);if(!r)continue;
   const previous=subject.work.get(w.googleCourseWorkId);if(!previous||previous.reviewedAt<r.updatedAt)subject.work.set(w.googleCourseWorkId,{id:w.googleCourseWorkId,title:w.title,dueDate:w.dueDate,type:r.category,reviewedAt:r.updatedAt});
  }
 }
 const rows=Array.from(subjects.values()).map(s=>{
  const members=new Set(students.filter(c=>c.googleCourseId===s.id).map(c=>c.ownerId));
  const eligible=members.size>=5;return {id:s.id,name:s.name,section:s.section,state:s.state,instructors:Array.from(s.instructors),syncedAt:s.syncedAt,workAvailable:s.workAvailable,eligible,studentCount:eligible?members.size:null,weeks:weekStarts.map(start=>{const items=Array.from(s.work.values()).filter(w=>weekStart(w.dueDate)===start);const load=items.reduce((n,w)=>n+({quiz:1,activity:2,exam:3}[w.type]),0);return {start,load:eligible&&s.workAvailable?load:null,band:eligible&&s.workAvailable?band(load):null,items:eligible&&s.workAvailable?items.map(({id,title,dueDate,type})=>({id,title,dueDate,type})):[]};})};
 });
 // Aggregate workload for active connected students, once per person (not per course).
 // Small populations and small high-workload counts are suppressed.
 const ids=new Set(students.map(s=>s.ownerId));
 const summary=weekStarts.map(start=>{let high=0;for(const id of ids){const memberships=students.filter(s=>s.ownerId===id);let load=0;for(const membership of memberships){const subject=subjects.get(membership.googleCourseId);if(subject?.state==='ACTIVE')for(const item of subject.work.values())if(weekStart(item.dueDate)===start)load+=({quiz:1,activity:2,exam:3}[item.type]);}if(load>=6)high++;}return {start,count:ids.size>=5&&high>=5?high:null,population:ids.size>=5?ids.size:null};});
 const connections=await ctx.db.query('classroomConnections').collect();const connectedInstructors=connections.filter(c=>active.get(c.ownerId)?.role==='instructor').length;
 return {subjects:rows.sort((a,b)=>a.name.localeCompare(b.name)),summary,connectedInstructors,syncConfigured:(process.env.CLASSROOM_SYNC_SECRET||'').length>=32};
}});
function weekStartSafe(date:string){try{return weekStart(date)}catch{return null}}

// Section labels are free text entered by Classroom teachers, not verified cohort IDs.
// Each student's dated visible-work counts stay private; only a >=5-student average
// is returned and no assignment titles or individual student values are exposed.
export const studentSectionOverview=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 await requireAccount(ctx,'admin');if(!weekStarts.length||weekStarts.length>12||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 12 Monday week starts.');
 const accounts=await ctx.db.query('accounts').collect(),active=new Set(accounts.filter(a=>a.active&&a.role==='student').map(a=>a._id));
 const snapshots=(await ctx.db.query('classroomSnapshots').collect()).filter(s=>s.role==='student'&&active.has(s.ownerId));
 type Snapshot=typeof snapshots[number];
 type Group={id:string;label:string;unlabelled:boolean;members:Map<string,Map<string,Snapshot>>};
 const groups=new Map<string,Group>();
 for(const c of snapshots){const label=c.section?.trim().replace(/\s+/g,' ')||'';const id=label?'section:'+label.toLocaleLowerCase('en-US'):'course:'+c.googleCourseId;let group=groups.get(id);if(!group){group={id,label:label||`No section · ${c.name}`,unlabelled:!label,members:new Map()};groups.set(id,group)}
  let member=group.members.get(c.ownerId);if(!member){member=new Map();group.members.set(c.ownerId,member)}const old=member.get(c.googleCourseId);if(!old||old.syncedAt<c.syncedAt)member.set(c.googleCourseId,c);
 }
 return Array.from(groups.values()).map(group=>{
  const members=Array.from(group.members.values());const eligible=members.length>=5;
  // Never convert failed or pre-migration snapshots into zero counts.
  const complete=members.every(member=>Array.from(member.values()).every(c=>c.workAvailable&&Array.isArray(c.weeklyCounts)));
  const available=eligible&&complete;
  return {id:group.id,label:group.label,unlabelled:group.unlabelled,studentCount:eligible?members.length:null,status:!eligible?'suppressed':!complete?'unavailable':'available',weeks:weekStarts.map(start=>{
   if(!available)return {start,average:null};
   const total=members.reduce((sum,member)=>sum+Array.from(member.values()).reduce((n,c)=>n+(c.weeklyCounts?.find((w:{start:string;count:number})=>w.start===start)?.count||0),0),0);
   return {start,average:Math.round(total/members.length*10)/10};
  })};
 }).sort((a,b)=>a.label.localeCompare(b.label));
}});
