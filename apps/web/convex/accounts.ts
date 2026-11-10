import {mutationGeneric,queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {emailPattern,identityEmail,normalizeEmail,requireAccount} from './access';
const role=v.union(v.literal('student'),v.literal('instructor'),v.literal('admin'));
export const me=queryGeneric({args:{},handler:async(ctx)=>requireAccount(ctx)});
// First administrator must both sign in as the configured verified Google account and invoke this once.
export const bootstrapAdmin=mutationGeneric({args:{},handler:async(ctx)=>{
 const identity=await identityEmail(ctx); const configured=normalizeEmail(process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL||'');
 if(!emailPattern.test(configured)||identity.email!==configured) throw new Error('Bootstrap is not authorized.');
 if(await ctx.db.query('bootstrap').first()) throw new Error('Bootstrap has already completed.');
 if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',identity.email)).unique()) throw new Error('Account already exists.');
 const id=await ctx.db.insert('accounts',{...identity,role:'admin',active:true}); await ctx.db.insert('bootstrap',{completed:true}); return id;
}});
export const list=queryGeneric({args:{},handler:async(ctx)=>{await requireAccount(ctx,'admin');return await ctx.db.query('accounts').collect()}});
export const provision=mutationGeneric({args:{email:v.string(),name:v.string(),role,program:v.optional(v.string()),yearLevel:v.optional(v.number())},handler:async(ctx,args)=>{
 await requireAccount(ctx,'admin'); const email=normalizeEmail(args.email),name=args.name.trim();
 if(!emailPattern.test(email)||!name||name.length>120)throw new Error('Enter a valid university email and name.');
 if(args.yearLevel!==undefined&&(!Number.isInteger(args.yearLevel)||args.yearLevel<1||args.yearLevel>10))throw new Error('Invalid year level.');
 if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique())throw new Error('Account already exists.');
 return await ctx.db.insert('accounts',{...args,email,name,active:true});
}});
// Deliberately do not provide a self-service role assignment or auto-create on sign-in.
export const setActive=mutationGeneric({args:{accountId:v.id('accounts'),active:v.boolean()},handler:async(ctx,{accountId,active})=>{
 const admin=await requireAccount(ctx,'admin');if(admin._id===accountId&&!active)throw new Error('You cannot disable your own account.');
 const account=await ctx.db.get(accountId);if(!account)throw new Error('Account not found.');await ctx.db.patch(accountId,{active});
}});
// This status endpoint never grants a role. The server still checks authorization on every operation.
export const status=queryGeneric({args:{},handler:async(ctx)=>{
 const identity=await ctx.auth.getUserIdentity();
 if(!identity||identity.emailVerified!==true||!identity.email)return {state:'invalid' as const};
 const email=normalizeEmail(identity.email);
 if(!emailPattern.test(email))return {state:'invalid' as const};
 const account=await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique();
 if(account?.active)return {state:'active' as const,account};
 const configured=normalizeEmail(process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL||'');
 const canBootstrap=!account&&configured===email&&!(await ctx.db.query('bootstrap').first());
 return {state:'unapproved' as const,canBootstrap};
}});
