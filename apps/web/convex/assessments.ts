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
// Return aggregates only. Candidate scores include the proposed item; counts are of students who already have 2+ major deadlines.
export const collision=queryGeneric({args:{courseId:v.id('courses'),dueDate:v.string(),type,weightPercent:v.number(),major:v.boolean(),excludeId:v.optional(v.id('assessments'))},handler:async(ctx,args)=>{
 await requireCourseOwner(ctx,args.courseId);validateAssessment({title:'Draft',...args});
 if(args.excludeId){const existing=await ctx.db.get(args.excludeId);if(!existing||existing.courseId!==args.courseId)throw new Error('Invalid deadline.');}
 const memberships=await ctx.db.query('memberships').withIndex('by_course',q=>q.eq('courseId',args.courseId)).collect();
 const all=await Promise.all(memberships.map(async m=>{const student=await ctx.db.get(m.studentId);if(!student||!student.active||student.role!=='student')return null;const links=await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',m.studentId)).collect();const sets=await Promise.all(links.map(l=>ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',l.courseId)).collect()));return sets.flat().filter(i=>i._id!==args.excludeId)}));
 const students=all.filter((x):x is NonNullable<typeof x>=>x!==null);
 function result(date:string){const week=weekStart(date);const lists=students.map(entries=>entries.filter(i=>weekStart(i.dueDate)===week));const affected=lists.filter(list=>list.filter(i=>i.major).length>=2).length;const average=students.length?lists.reduce((n,list)=>n+score(list)+score([args]),0)/students.length:0;return {date,studentsAffected:affected,totalStudents:students.length,averageLoad:average,band:band(average)}}
 const suggestions=Array.from({length:15},(_,i)=>addDays(args.dueDate,i-7)).filter(date=>{const day=new Date(date+'T00:00:00Z').getUTCDay();return date!==args.dueDate&&day!==0&&day!==6}).map(result).sort((a,b)=>a.averageLoad-b.averageLoad||a.studentsAffected-b.studentsAffected||a.date.localeCompare(b.date)).slice(0,3);
 return {current:result(args.dueDate),suggestions};
}});
