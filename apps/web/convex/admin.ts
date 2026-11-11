import {queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';
export const heatmap=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 await requireAccount(ctx,'admin');if(weekStarts.length<1||weekStarts.length>20||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 20 Monday week starts.');
 const sections=await ctx.db.query('academicSections').collect();const results=await Promise.all(sections.map(async section=>{
 const members=await ctx.db.query('sectionMembers').withIndex('by_section',q=>q.eq('academicSectionId',section._id)).collect();const students=(await Promise.all(members.map(m=>ctx.db.get(m.studentId)))).filter(s=>s&&s.active&&s.role==='student');if(students.length<5)return null;
 const offerings=await ctx.db.query('courses').withIndex('by_academic_section',q=>q.eq('academicSectionId',section._id)).collect();const entries=(await Promise.all(offerings.map(c=>ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',c._id)).collect()))).flat();return {id:section._id,code:section.code,term:section.term,program:section.program,yearLevel:section.yearLevel,studentCount:students.length,offeringCount:offerings.length,weeks:weekStarts.map(start=>{const load=score(entries.filter(d=>weekStart(d.dueDate)===start));return {start,averageLoad:load,band:band(load)}})};
 }));return results.filter((r):r is NonNullable<typeof r>=>r!==null);
}});
