import {mutationGeneric,queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {emailPattern,allowedEmail,exceptionAdmins,identityEmail,normalizeEmail,requireAccount,firebaseIdentity} from './access';
const role=v.union(v.literal('student'),v.literal('instructor'),v.literal('admin'));
export const me=queryGeneric({args:{},handler:async(ctx)=>requireAccount(ctx)});
// Users may edit only their own display name and optional contact number.
export const updateProfile=mutationGeneric({args:{name:v.string(),contact:v.string()},handler:async(ctx,{name,contact})=>{
 const account=await requireAccount(ctx);const cleanName=name.trim(),cleanContact=contact.trim();
 if(!cleanName||cleanName.length>120)throw new Error('Enter a name of up to 120 characters.');
 if(cleanContact.length>40)throw new Error('Contact number must be 40 characters or fewer.');
 await ctx.db.patch(account._id as Id<'accounts'>,{name:cleanName,contact:cleanContact||undefined});
}});
// First administrator must both sign in as the configured university account and invoke this once.
export const bootstrapAdmin=mutationGeneric({args:{},handler:async(ctx)=>{
 const identity=await identityEmail(ctx); const configured=normalizeEmail(process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL||'');
 if(!emailPattern.test(configured)||identity.email!==configured) throw new Error('Bootstrap is not authorized.');
 if(await ctx.db.query('bootstrap').first()) throw new Error('Bootstrap has already completed.');
 if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',identity.email)).unique()) throw new Error('Account already exists.');
 if(await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.uid)).unique())throw new Error('Identity is already linked.');
 const id=await ctx.db.insert('accounts',{email:identity.email,name:identity.name,firebaseUid:identity.uid,role:'admin',active:true}); await ctx.db.insert('bootstrap',{completed:true}); return id;
}});
export const list=queryGeneric({args:{},handler:async(ctx)=>{await requireAccount(ctx,'admin');return await ctx.db.query('accounts').collect()}});
export const provision=mutationGeneric({args:{email:v.string(),name:v.string(),role,program:v.optional(v.string()),yearLevel:v.optional(v.number())},handler:async(ctx,args)=>{
 await requireAccount(ctx,'admin'); const email=normalizeEmail(args.email),name=args.name.trim();
 if(!emailPattern.test(email)||!name||name.length>120)throw new Error('Enter a valid university email and name.');
 if(args.yearLevel!==undefined&&(!Number.isInteger(args.yearLevel)||args.yearLevel<1||args.yearLevel>10))throw new Error('Invalid year level.');
 if(await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique())throw new Error('Account already exists.');
 return await ctx.db.insert('accounts',{...args,email,name,active:true});
}});
// Roles and activation are managed by an administrator.
export const setActive=mutationGeneric({args:{accountId:v.id('accounts'),active:v.boolean()},handler:async(ctx,{accountId,active})=>{
 const admin=await requireAccount(ctx,'admin');if(admin._id===accountId&&!active)throw new Error('You cannot disable your own account.');
 const account=await ctx.db.get(accountId);if(!account)throw new Error('Account not found.');await ctx.db.patch(accountId,{active});
}});
// Only an admin can change existing student/instructor roles; admin roles are unchanged.
export const setTeachingRole=mutationGeneric({args:{accountId:v.id('accounts'),role:v.union(v.literal('student'),v.literal('instructor'))},handler:async(ctx,{accountId,role})=>{
 await requireAccount(ctx,'admin');
 const account=await ctx.db.get(accountId);
 if(!account||account.role==='admin')throw new Error('Only student and instructor roles can be changed here.');
 await ctx.db.patch(accountId,{role});
}});
// Self-service creates new students, with two explicitly designated admin exceptions. Existing records, including disabled
// and privileged accounts, must never be replaced or silently claimed here.
export const registerStudent=mutationGeneric({args:{},handler:async(ctx)=>{
 const identity=await identityEmail(ctx);
 const linked=await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.uid)).unique();
 if(linked){if(!linked.active)throw new Error('Account is disabled.');return linked._id;}
 const existing=await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',identity.email)).unique();
 if(existing)throw new Error('This account already exists. Contact your administrator if you cannot link it.');
 const configured=normalizeEmail(process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL||'');
 if(identity.email===configured&&!(await ctx.db.query('bootstrap').first()))throw new Error('Set up the first administrator before continuing.');
 return await ctx.db.insert('accounts',{firebaseUid:identity.uid,email:identity.email,name:identity.name,role:exceptionAdmins.has(identity.email)?'admin':'student',active:true});
}});
// Link only an existing, active, administrator-approved account with a matching university email.
// Once linked, ownership is always resolved by UID, never by email.
export const linkApprovedAccount=mutationGeneric({args:{},handler:async(ctx)=>{
 const identity=await identityEmail(ctx);const linked=await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.uid)).unique();if(linked){if(!linked.active)throw new Error('Account is disabled.');return linked._id;}
 const account=await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',identity.email)).unique();if(!account||!account.active||account.firebaseUid)throw new Error('Account is not approved or is already linked. Contact your administrator.');
 await ctx.db.patch(account._id,{firebaseUid:identity.uid});return account._id;
}});
export const status=queryGeneric({args:{},handler:async(ctx)=>{
 const identity=await ctx.auth.getUserIdentity();if(!identity||!identity.subject)return {state:'invalid' as const,reason:'missing_identity' as const};
 if(!identity.email)return {state:'invalid' as const,reason:'missing_email' as const};const email=normalizeEmail(identity.email);if(!allowedEmail(email))return {state:'invalid' as const,reason:'invalid_format' as const,email};
 const account=await ctx.db.query('accounts').withIndex('by_firebase_uid',q=>q.eq('firebaseUid',identity.subject)).unique();if(account)return account.active?{state:'active' as const,account}:{state:'unapproved' as const,canBootstrap:false,canLink:false};
 const approved=await ctx.db.query('accounts').withIndex('by_email',q=>q.eq('email',email)).unique();const configured=normalizeEmail(process.env.PULSO_BOOTSTRAP_ADMIN_EMAIL||'');const canBootstrap=!approved&&configured===email&&!(await ctx.db.query('bootstrap').first());
 return {state:'unapproved' as const,canBootstrap,canLink:!!approved&&approved.active&&!approved.firebaseUid,canRegister:!approved&&!canBootstrap};
}});
