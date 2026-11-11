import {queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';

// A teacher can inspect only academic sections containing their own offerings.
export const overview=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 const teacher=await requireAccount(ctx,'instructor');
 if(!weekStarts.length||weekStarts.length>12||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 12 Monday week starts.');
 const courses=await ctx.db.query('courses').withIndex('by_instructor',q=>q.eq('instructorId',teacher._id)).collect();
 return await Promise.all(courses.map(async course=>{
  const own=await ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',course._id)).collect();
  if(!course.academicSectionId)return {course,section:null,studentCount:0,offerings:[],entries:[],own,weeks:[]};
  const section=await ctx.db.get(course.academicSectionId);if(!section)return {course,section:null,studentCount:0,offerings:[],entries:[],own,weeks:[]};
  const members=await ctx.db.query('sectionMembers').withIndex('by_section',q=>q.eq('academicSectionId',section._id)).collect();
  const studentCount=(await Promise.all(members.map(m=>ctx.db.get(m.studentId)))).filter(a=>a?.active&&a.role==='student').length;
  const offerings=await ctx.db.query('courses').withIndex('by_academic_section',q=>q.eq('academicSectionId',section._id)).collect();
  const entries=(await Promise.all(offerings.map(async c=>(await ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',c._id)).collect()).map(d=>({...d,subject:c.subject,section:section.code}))))).flat();
  return {course,section,studentCount,offerings:offerings.map(c=>c.subject),entries,own,weeks:weekStarts.map(start=>{const load=score(entries.filter(d=>weekStart(d.dueDate)===start));return {start,load,band:band(load)}})};
 }));
}});

// One row per Google Classroom course, not per section label: section text is
// teacher-entered and cannot safely identify a cohort across different subjects.
export const classroomOverview=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 const teacher=await requireAccount(ctx,'instructor');
 if(!weekStarts.length||weekStarts.length>12||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 12 Monday week starts.');
 const courses=(await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',teacher._id)).collect()).filter(c=>c.role==='instructor');
 const reviews=await ctx.db.query('classroomReviews').withIndex('by_owner',q=>q.eq('ownerId',teacher._id)).collect();
 return courses.map(course=>{
  const confirmed:{id:string;title:string;dueDate:string;type:'quiz'|'activity'|'exam'}[]=course.workAvailable?course.work.flatMap((work:{googleCourseWorkId:string;title:string;dueDate?:string;assigneeMode?:string})=>{
   if(!work.dueDate||work.assigneeMode!=='ALL_STUDENTS')return [];
   try{weekStart(work.dueDate)}catch{return []}
   const review=reviews.find(r=>r.googleCourseId===course.googleCourseId&&r.googleCourseWorkId===work.googleCourseWorkId);if(!review)return [];
   return [{id:work.googleCourseWorkId,title:work.title,dueDate:work.dueDate,type:review.category}];
  }):[];
  return {id:course.googleCourseId,name:course.name,section:course.section||'',state:course.courseState||'UNKNOWN',workAvailable:course.workAvailable,syncedAt:course.syncedAt,weeks:weekStarts.map(start=>{
   const items=confirmed.filter(w=>weekStart(w.dueDate)===start);const load=items.reduce((sum,item)=>sum+({quiz:1,activity:2,exam:3}[item.type]),0);
   return {start,load,band:band(load),items};
  })};
 }).sort((a,b)=>a.name.localeCompare(b.name)||a.section.localeCompare(b.section));
}});
