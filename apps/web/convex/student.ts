import {queryGeneric} from 'convex/server';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';
export const timeline=queryGeneric({args:{},handler:async(ctx)=>{
 const student=await requireAccount(ctx,'student');const membership=await ctx.db.query('sectionMembers').withIndex('by_student',q=>q.eq('studentId',student._id)).unique();const section=membership?await ctx.db.get(membership.academicSectionId):null;
 const courses=section?await ctx.db.query('courses').withIndex('by_academic_section',q=>q.eq('academicSectionId',section._id)).collect():[];
 const shared=(await Promise.all(courses.map(async course=>(await ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',course._id)).collect()).map(d=>({...d,subject:course.subject,section:section!.code}))))).flat().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 // Previously assigned course memberships are retained as individual data. Do not silently merge into section scores.
 const oldLinks=await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',student._id)).collect();const adjustments=(await Promise.all(oldLinks.filter(l=>!courses.some(c=>c._id===l.courseId)).map(async link=>{const course=await ctx.db.get(link.courseId);if(!course)return [];return (await ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',link.courseId)).collect()).map(d=>({...d,subject:course.subject,section:course.name}))}))).flat().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
 const starts=Array.from(new Set(shared.map(d=>weekStart(d.dueDate)))).sort();return {section,entries:shared,adjustments,weeks:starts.map(start=>{const load=score(shared.filter(d=>weekStart(d.dueDate)===start));return {start,load,band:band(load)}})};
}});
