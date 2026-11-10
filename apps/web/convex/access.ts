import type {GenericQueryCtx, GenericMutationCtx, GenericDataModel} from 'convex/server';

type Ctx = GenericQueryCtx<GenericDataModel> | GenericMutationCtx<GenericDataModel>;
export const emailPattern = /^\d{4}-\d{4}@lspu\.edu\.ph$/;
export function normalizeEmail(email:string) {return email.trim().toLowerCase();}
export async function identityEmail(ctx:Ctx) {
  const identity=await ctx.auth.getUserIdentity();
  if (!identity || identity.emailVerified !== true || !identity.email) throw new Error('A verified university Google account is required.');
  const email=normalizeEmail(identity.email);
  if (!emailPattern.test(email)) throw new Error('Use a university email in the format 0000-0000@lspu.edu.ph.');
  return {email, name:identity.name || email};
}
export async function requireAccount(ctx:Ctx, role?:'student'|'instructor'|'admin') {
  const {email}=await identityEmail(ctx);
  const account=await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique();
  if (!account || !account.active || (role && account.role!==role)) throw new Error('You do not have permission to access this resource.');
  return account;
}
export async function requireCourseOwner(ctx:Ctx, courseId:any) {
  const user=await requireAccount(ctx,'instructor');
  const course=await ctx.db.get(courseId);
  if (!course || course.instructorId!==user._id) throw new Error('You do not have permission to manage this section.');
  return {user,course};
}
