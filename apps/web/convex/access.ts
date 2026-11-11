import type {GenericQueryCtx, GenericMutationCtx, GenericDataModel} from 'convex/server';

type Ctx = GenericQueryCtx<GenericDataModel> | GenericMutationCtx<GenericDataModel>;
export const emailPattern = /^\d{4}-\d{4}@lspu\.edu\.ph$/;
export function normalizeEmail(email:string) {return email.trim().toLowerCase();}
export async function firebaseIdentity(ctx:Ctx){const identity=await ctx.auth.getUserIdentity();if(!identity||!identity.subject)throw new Error('Sign in is required.');return identity;}
// Verified email is only used for bootstrap and the one-time link to a pre-approved record.
export async function identityEmail(ctx:Ctx) {
 const identity=await firebaseIdentity(ctx);if(identity.emailVerified!==true||!identity.email)throw new Error('A verified university Google account is required.');
 const email=normalizeEmail(identity.email);if(!emailPattern.test(email))throw new Error('Use a university email in the format 0000-0000@lspu.edu.ph.');return {email,name:identity.name||email,uid:identity.subject};
}
export async function requireAccount(ctx:Ctx,role?:'student'|'instructor'|'admin'){
 const identity=await firebaseIdentity(ctx);const account=await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.subject)).unique();
 if(!account||!account.active||(role&&account.role!==role))throw new Error('You do not have permission to access this resource.');return account;
}
export async function requireCourseOwner(ctx:Ctx,courseId:any){const user=await requireAccount(ctx,'instructor');const course=await ctx.db.get(courseId);if(!course||course.instructorId!==user._id)throw new Error('You do not have permission to manage this section.');return {user,course};}
