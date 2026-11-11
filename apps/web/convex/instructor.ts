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
