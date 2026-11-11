import {queryGeneric,mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart} from './calculations';
function checkSecret(secret:string){const expected=process.env.CLASSROOM_SYNC_SECRET;if(!expected||expected.length<32||secret!==expected)throw new Error('Classroom sync not configured.');}
// Authenticated server-only bridge. The admin browser does not receive encrypted credentials.
export const studentConnections=queryGeneric({args:{secret:v.string(),cursor:v.union(v.string(),v.null())},handler:async(ctx,{secret,cursor})=>{
 await requireAccount(ctx,'admin');checkSecret(secret);
 const result=await ctx.db.query('classroomConnections').paginate({numItems:3,cursor});
 const students=(await Promise.all(result.page.map(async connection=>{const account=await ctx.db.get(connection.ownerId);return account?.active&&account.role==='student'&&account.firebaseUid?{accountId:account._id,uid:account.firebaseUid,connectionId:connection._id,encryptedRefreshToken:connection.encryptedRefreshToken}:null}))).filter((x):x is NonNullable<typeof x>=>x!==null);
 return {students,cursor:result.continueCursor,done:result.isDone};
}});
const courseValidator=v.array(v.object({googleCourseId:v.string(),name:v.string(),courseState:v.optional(v.string()),section:v.optional(v.string()),workAvailable:v.boolean(),weeklyCounts:v.optional(v.array(v.object({start:v.string(),count:v.number()})))}));
export const saveStudentSnapshot=mutationGeneric({args:{secret:v.string(),accountId:v.id('accounts'),connectionId:v.id('classroomConnections'),encryptedRefreshToken:v.string(),startedAt:v.number(),courses:courseValidator},handler:async(ctx,args)=>{
 await requireAccount(ctx,'admin');checkSecret(args.secret);
 const account=await ctx.db.get(args.accountId),connection=await ctx.db.get(args.connectionId);
 if(!account?.active||account.role!=='student'||!connection||connection.ownerId!==account._id||connection.encryptedRefreshToken!==args.encryptedRefreshToken)throw new Error('Connection changed.');
 if(args.courses.length>500||args.courses.some(c=>!c.googleCourseId||c.googleCourseId.length>256||!c.name||c.name.length>500||c.weeklyCounts&&( !c.workAvailable||c.weeklyCounts.length>1000||new Set(c.weeklyCounts.map(w=>w.start)).size!==c.weeklyCounts.length||c.weeklyCounts.some(w=>!Number.isInteger(w.count)||w.count<1||w.count>1000||weekStart(w.start)!==w.start))))throw new Error('Invalid Classroom snapshot.');
 const old=await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',account._id)).collect();
 // A student refresh that completed later must not be overwritten by an older admin request.
 if(old.some(row=>row.syncedAt>args.startedAt))return;
 for(const row of old)await ctx.db.delete(row._id);const now=Date.now();
 for(const course of args.courses)await ctx.db.insert('classroomSnapshots',{...course,ownerId:account._id,role:'student',syncedAt:now,work:[]});
}});
export const markStudentUnavailable=mutationGeneric({args:{secret:v.string(),accountId:v.id('accounts'),connectionId:v.id('classroomConnections'),encryptedRefreshToken:v.string(),startedAt:v.number()},handler:async(ctx,args)=>{
 await requireAccount(ctx,'admin');checkSecret(args.secret);const account=await ctx.db.get(args.accountId),connection=await ctx.db.get(args.connectionId);
 if(!account?.active||account.role!=='student'||!connection||connection.ownerId!==account._id||connection.encryptedRefreshToken!==args.encryptedRefreshToken)return;
 const old=await ctx.db.query('classroomSnapshots').withIndex('by_owner',q=>q.eq('ownerId',account._id)).collect();
 for(const row of old)if(row.syncedAt<=args.startedAt)await ctx.db.patch(row._id,{workAvailable:false});
}});
