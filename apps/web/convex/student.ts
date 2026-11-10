import {queryGeneric} from 'convex/server';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';
export const timeline=queryGeneric({args:{},handler:async(ctx)=>{
 const student=await requireAccount(ctx,'student');const links=await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',student._id)).collect();
 const sets=await Promise.all(links.map(async link=>{const course=await ctx.db.get(link.courseId);if(!course)return [];const deadlines=await ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',link.courseId)).collect();return deadlines.map(d=>({...d,subject:course.subject,section:course.name}))}));
 const entries=sets.flat().sort((a,b)=>a.dueDate.localeCompare(b.dueDate));const starts=Array.from(new Set(entries.map(d=>weekStart(d.dueDate)))).sort();return {entries,weeks:starts.map(start=>{const load=score(entries.filter(d=>weekStart(d.dueDate)===start));return {start,load,band:band(load)}})};
}});
