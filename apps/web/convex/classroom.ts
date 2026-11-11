import {queryGeneric, mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';

// Private cache only; no OAuth credentials or teacher-visible coursework are returned.
// Empty results do not imply that a Google account is connected: OAuth is not implemented yet.
export const studentCourses = queryGeneric({args:{},handler:async ctx=>{
 const student=await requireAccount(ctx,'student');
 const courses=await ctx.db.query('classroomStudentCourses').withIndex('by_owner',q=>q.eq('ownerId',student._id)).collect();
 return courses.map(course=>({_id:course._id,name:course.name,selected:course.selected}));
}});

export const selectStudentCourse = mutationGeneric({args:{courseId:v.id('classroomStudentCourses'),selected:v.boolean()},handler:async(ctx,{courseId,selected})=>{
 const student=await requireAccount(ctx,'student');
 const course=await ctx.db.get(courseId);
 if(!course||course.ownerId!==student._id)throw new Error('Course not found.');
 await ctx.db.patch(courseId,{selected});
}});

export const studentWork = queryGeneric({args:{},handler:async ctx=>{
 const student=await requireAccount(ctx,'student');
 const courses=await ctx.db.query('classroomStudentCourses').withIndex('by_owner',q=>q.eq('ownerId',student._id)).collect();
 const work=await ctx.db.query('classroomStudentWork').withIndex('by_owner_course',q=>q.eq('ownerId',student._id)).collect();
 const selectedCourses=new Map(courses.filter(course=>course.selected).map(course=>[course.googleCourseId,course.name]));
 const items=work.filter(item=>item.state==='PUBLISHED'&&selectedCourses.has(item.googleCourseId)).map(item=>({_id:item._id,courseName:selectedCourses.get(item.googleCourseId)!,title:item.title,dueDate:item.dueDate,sourceUrl:item.sourceUrl,updatedAt:item.updatedAt}));
 return items.sort((a,b)=>(a.dueDate||'9999-99-99').localeCompare(b.dueDate||'9999-99-99')||a.title.localeCompare(b.title));
}});
