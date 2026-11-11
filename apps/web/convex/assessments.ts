import {mutationGeneric,queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireCourseOwner} from './access';
import {validateAssessment,weekStart,addDays,score,band} from './calculations';
const type=v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance'));
const fields={title:v.string(),type,dueDate:v.string(),weightPercent:v.number(),major:v.boolean()};
export const list=queryGeneric({args:{courseId:v.id('courses')},handler:async(ctx,{courseId})=>{await requireCourseOwner(ctx,courseId);return ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',courseId)).collect()}});
export const create=mutationGeneric({args:{courseId:v.id('courses'),...fields},handler:async(ctx,args)=>{const {user}=await requireCourseOwner(ctx,args.courseId);validateAssessment(args);return ctx.db.insert('assessments',{...args,title:args.title.trim(),createdBy:user._id,updatedAt:Date.now()})}});
export const update=mutationGeneric({args:{assessmentId:v.id('assessments'),...fields},handler:async(ctx,{assessmentId,...fields})=>{const entry=await ctx.db.get(assessmentId);if(!entry)throw new Error('Deadline not found.');await requireCourseOwner(ctx,entry.courseId);validateAssessment(fields);await ctx.db.patch(assessmentId,{...fields,title:fields.title.trim(),updatedAt:Date.now()})}});
export const remove=mutationGeneric({args:{assessmentId:v.id('assessments')},handler:async(ctx,{assessmentId})=>{const entry=await ctx.db.get(assessmentId);if(!entry)throw new Error('Deadline not found.');await requireCourseOwner(ctx,entry.courseId);await ctx.db.delete(assessmentId)}});
// Only the parent section's registered offerings count towards the shared load.
export const collision=queryGeneric({args:{courseId:v.id('courses'),dueDate:v.string(),type,weightPercent:v.number(),major:v.boolean(),excludeId:v.optional(v.id('assessments'))},handler:async(ctx,args)=>{
 await requireCourseOwner(ctx,args.courseId);const course=await ctx.db.get(args.courseId);if(!course)throw new Error('Course not found.');validateAssessment({title:'Draft',...args});
 if(args.excludeId){const existing=await ctx.db.get(args.excludeId);if(!existing||existing.courseId!==args.courseId)throw new Error('Invalid deadline.');}
 if(!course.academicSectionId)return {unmapped:true as const};
 const section=await ctx.db.get(course.academicSectionId);if(!section)throw new Error('Academic section not found.');
 const offerings=await ctx.db.query('courses').withIndex('by_academic_section',q=>q.eq('academicSectionId',section._id)).collect();
 const entries=(await Promise.all(offerings.map(c=>ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',c._id)).collect()))).flat().filter(d=>d._id!==args.excludeId);
 const members=await ctx.db.query('sectionMembers').withIndex('by_section',q=>q.eq('academicSectionId',section._id)).collect();const students=(await Promise.all(members.map(m=>ctx.db.get(m.studentId)))).filter(s=>s&&s.active&&s.role==='student');
 function result(date:string){const week=weekStart(date);const items=entries.filter(i=>weekStart(i.dueDate)===week);const load=score(items)+score([args]);return {date,sharedDeadlineCount:items.length+1,load,band:band(load)}}
 const suggestions=Array.from({length:15},(_,i)=>addDays(args.dueDate,i-7)).filter(date=>{const day=new Date(date+'T00:00:00Z').getUTCDay();return date!==args.dueDate&&day!==0&&day!==6}).map(result).sort((a,b)=>a.load-b.load||a.sharedDeadlineCount-b.sharedDeadlineCount||a.date.localeCompare(b.date)).slice(0,3);
 return {unmapped:false as const,section:section.code,totalStudents:students.length,offerings:offerings.map(c=>c.subject),current:result(args.dueDate),suggestions};
}});
