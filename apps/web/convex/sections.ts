import {mutationGeneric,queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
export const list=queryGeneric({args:{},handler:async(ctx)=>{const user=await requireAccount(ctx);if(user.role==='admin')return await ctx.db.query('courses').collect();if(user.role==='instructor')return await ctx.db.query('courses').withIndex('by_instructor',q=>q.eq('instructorId',user._id)).collect();const memberships=await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',user._id)).collect();return (await Promise.all(memberships.map(m=>ctx.db.get(m.courseId)))).filter(Boolean)}});
export const create=mutationGeneric({args:{subject:v.string(),name:v.string(),program:v.string(),yearLevel:v.number(),instructorId:v.id('accounts')},handler:async(ctx,args)=>{
 await requireAccount(ctx,'admin');const instructor=await ctx.db.get(args.instructorId);
 if(!instructor||!instructor.active||instructor.role!=='instructor')throw new Error('Select an active instructor.');
 if(!args.subject.trim()||!args.name.trim()||!args.program.trim()||[args.subject,args.name,args.program].some(s=>s.length>120)||!Number.isInteger(args.yearLevel)||args.yearLevel<1||args.yearLevel>10)throw new Error('Invalid section details.');
 return ctx.db.insert('courses',{...args,subject:args.subject.trim(),name:args.name.trim(),program:args.program.trim()});
}});
export const enroll=mutationGeneric({args:{studentId:v.id('accounts'),courseId:v.id('courses')},handler:async(ctx,{studentId,courseId})=>{
 await requireAccount(ctx,'admin');const student=await ctx.db.get(studentId),course=await ctx.db.get(courseId);if(!student||!student.active||student.role!=='student'||!course)throw new Error('Select an active student and a section.');
 if((await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',studentId)).collect()).find(m=>m.courseId===courseId))throw new Error('Student is already enrolled.');return ctx.db.insert('memberships',{studentId,courseId});
}});
export const unenroll=mutationGeneric({args:{studentId:v.id('accounts'),courseId:v.id('courses')},handler:async(ctx,{studentId,courseId})=>{await requireAccount(ctx,'admin');const entry=(await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',studentId)).collect()).find(m=>m.courseId===courseId);if(entry)await ctx.db.delete(entry._id)}});
export const roster=queryGeneric({args:{courseId:v.id('courses')},handler:async(ctx,{courseId})=>{await requireAccount(ctx,'admin');const members=await ctx.db.query('memberships').withIndex('by_course',q=>q.eq('courseId',courseId)).collect();return (await Promise.all(members.map(m=>ctx.db.get(m.studentId)))).filter(Boolean)}});
