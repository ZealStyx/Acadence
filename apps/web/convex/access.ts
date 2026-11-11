import type {GenericQueryCtx, GenericMutationCtx, GenericDataModel} from 'convex/server';

type Ctx = GenericQueryCtx<GenericDataModel> | GenericMutationCtx<GenericDataModel>;
export const emailPattern = /^[^\s@]+@lspu\.edu\.ph$/;
export const exceptionAdmins = new Set(['johnalexalcazar@gmail.com','alcazarjohnalex@gmail.com']);
export function allowedEmail(email:string) {return emailPattern.test(email) || exceptionAdmins.has(email);}
export function normalizeEmail(email:string) {return email.trim().toLowerCase();}
export async function firebaseIdentity(ctx:Ctx){const identity=await ctx.auth.getUserIdentity();if(!identity||!identity.subject)throw new Error('Sign in is required.');return identity;}
// Email domain is checked for all identities; account ownership is keyed by Firebase UID.
export async function identityEmail(ctx:Ctx) {
 const identity=await firebaseIdentity(ctx);if(!identity.email)throw new Error('A university email is required.');
 const email=normalizeEmail(identity.email);if(!allowedEmail(email))throw new Error('Use an authorized account.');return {email,name:identity.name||email,uid:identity.subject};
}
export async function requireAccount(ctx:Ctx,role?:'student'|'instructor'|'admin'){
 const identity=await identityEmail(ctx);const account=await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.uid)).unique();
 if(!account||!account.active||(role&&account.role!==role))throw new Error('You do not have permission to access this resource.');return account;
}
export async function requireCourseOwner(ctx:Ctx,courseId:any){const user=await requireAccount(ctx,'instructor');const course=await ctx.db.get(courseId);if(!course||course.instructorId!==user._id)throw new Error('You do not have permission to manage this section.');return {user,course};}
