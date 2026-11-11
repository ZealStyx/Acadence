import {queryGeneric, mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart} from './calculations';

// Private cache only; no OAuth credentials or teacher-visible coursework are returned.
// These optional cache queries are separate from the on-demand OAuth connection.
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

// Only encrypted, UID-bound credentials are stored. Encryption keys remain on the web server.
export const connection = queryGeneric({args:{},handler:async ctx=>{
 const student=await requireAccount(ctx);
 if(student.role==='admin')throw new Error('Student or instructor access required.');
 const row=await ctx.db.query('classroomConnections').withIndex('by_owner',q=>q.eq('ownerId',student._id)).unique();
 return row?{encryptedRefreshToken:row.encryptedRefreshToken}:null;
}});
export const saveConnection = mutationGeneric({args:{encryptedRefreshToken:v.string()},handler:async(ctx,{encryptedRefreshToken})=>{
 const student=await requireAccount(ctx);
 if(encryptedRefreshToken.length>8192||!encryptedRefreshToken.startsWith('v1.'))throw new Error('Invalid credential.');
 if(student.role==='admin')throw new Error('Student or instructor access required.');
 const row=await ctx.db.query('classroomConnections').withIndex('by_owner',q=>q.eq('ownerId',student._id)).unique();
 if(row)await ctx.db.patch(row._id,{encryptedRefreshToken});else await ctx.db.insert('classroomConnections',{ownerId:student._id,encryptedRefreshToken});
}});
export const removeConnection = mutationGeneric({args:{},handler:async ctx=>{
 const student=await requireAccount(ctx);
 if(student.role==='admin')throw new Error('Student or instructor access required.');
 const row=await ctx.db.query('classroomConnections').withIndex('by_owner',q=>q.eq('ownerId',student._id)).unique();
 if(row)await ctx.db.delete(row._id);
 const snapshots=await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',student._id)).collect();for(const snapshot of snapshots)await ctx.db.delete(snapshot._id);
}});

// Private instructor review decisions are not shared section deadlines.
export const reviews=queryGeneric({args:{},handler:async ctx=>{
 const instructor=await requireAccount(ctx,'instructor');
 return await ctx.db.query('classroomReviews').withIndex('by_owner',q=>q.eq('ownerId',instructor._id)).collect();
}});
export const confirmReview=mutationGeneric({args:{googleCourseId:v.string(),googleCourseWorkId:v.string(),category:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'))},handler:async(ctx,args)=>{
 const instructor=await requireAccount(ctx,'instructor');
 if(!args.googleCourseId||!args.googleCourseWorkId||args.googleCourseId.length>256||args.googleCourseWorkId.length>256)throw new Error('Invalid Classroom identifiers.');
 const all=await ctx.db.query('classroomReviews').withIndex('by_owner',q=>q.eq('ownerId',instructor._id)).collect();
 const existing=all.find(r=>r.googleCourseId===args.googleCourseId&&r.googleCourseWorkId===args.googleCourseWorkId);
 if(existing)await ctx.db.patch(existing._id,{category:args.category,updatedAt:Date.now()});else await ctx.db.insert('classroomReviews',{...args,ownerId:instructor._id,updatedAt:Date.now()});
}});

// Server-authenticated snapshots: browser callers cannot invent Classroom membership or work.
export const syncSnapshot=mutationGeneric({args:{secret:v.string(),courses:v.array(v.object({googleCourseId:v.string(),name:v.string(),courseState:v.optional(v.string()),section:v.optional(v.string()),workAvailable:v.boolean(),weeklyCounts:v.optional(v.array(v.object({start:v.string(),count:v.number()}))),work:v.array(v.object({googleCourseWorkId:v.string(),title:v.string(),dueDate:v.optional(v.string()),assigneeMode:v.optional(v.string())}))}))},handler:async(ctx,{secret,courses})=>{
 const account=await requireAccount(ctx);if(account.role==='admin')throw new Error('Student or instructor access required.');
 const expected=process.env.CLASSROOM_SYNC_SECRET;if(!expected||expected.length<32||secret!==expected)throw new Error('Classroom sync not configured.');
 if(courses.length>500||courses.some(c=>!c.googleCourseId||c.googleCourseId.length>256||!c.name||c.name.length>500||c.work.length>1000||c.work.some(w=>!w.googleCourseWorkId||w.googleCourseWorkId.length>256||!w.title||w.title.length>500)))throw new Error('Invalid Classroom snapshot.');
 if(courses.some(c=>c.weeklyCounts&&(account.role!=='student'||!c.workAvailable||c.weeklyCounts.length>1000||new Set(c.weeklyCounts.map(w=>w.start)).size!==c.weeklyCounts.length||c.weeklyCounts.some(w=>!Number.isInteger(w.count)||w.count<1||w.count>1000||weekStart(w.start)!==w.start))))throw new Error('Invalid weekly counts.');
 const old=await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',account._id)).collect();for(const row of old)await ctx.db.delete(row._id);
 const now=Date.now();for(const course of courses)await ctx.db.insert('classroomSnapshots',{...course,ownerId:account._id,role:account.role,syncedAt:now});
}});

// Own Classroom memberships only; excludes individually assigned or unconfirmed work.
export const studentConfirmed=queryGeneric({args:{},handler:async ctx=>{
 const student=await requireAccount(ctx,'student');
 const own=await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',student._id)).collect();
 const memberships=own.filter(c=>c.role==='student');const results=new Map<string,{id:string;course:string;title:string;dueDate:string;type:'quiz'|'activity'|'exam';reviewedAt:number}>();
 for(const membership of memberships){
  const teachers=await ctx.db.query('classroomSnapshots').withIndex('by_course',q=>q.eq('googleCourseId',membership.googleCourseId)).collect();
  for(const teacher of teachers){if(teacher.role!=='instructor'||teacher.courseState!=='ACTIVE'||!teacher.workAvailable)continue;const account=await ctx.db.get(teacher.ownerId);if(!account?.active||account.role!=='instructor')continue;
   for(const work of teacher.work){if(work.assigneeMode!=='ALL_STUDENTS'||!work.dueDate||!/^\d{4}-\d{2}-\d{2}$/.test(work.dueDate))continue;
    const reviews=await ctx.db.query('classroomReviews').withIndex('by_owner',q=>q.eq('ownerId',teacher.ownerId)).collect();const review=reviews.find(r=>r.googleCourseId===teacher.googleCourseId&&r.googleCourseWorkId===work.googleCourseWorkId);if(!review)continue;
    const id=JSON.stringify([teacher.googleCourseId,work.googleCourseWorkId]),previous=results.get(id);if(!previous||review.updatedAt>previous.reviewedAt)results.set(id,{id,course:teacher.name,title:work.title,dueDate:work.dueDate,type:review.category,reviewedAt:review.updatedAt});
   }
  }
 }
 return {connected:memberships.length>0,entries:Array.from(results.values()).sort((a,b)=>a.dueDate.localeCompare(b.dueDate))};
}});
