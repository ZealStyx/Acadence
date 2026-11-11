import {mutationGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
const choice=v.union(v.literal('balance'),v.literal('prioritize'),v.literal('pace'),v.literal('fallback'));
const validateHash=(hash:string)=>{if(!/^[a-f0-9]{64}$/.test(hash))throw new Error('Invalid insight key.');};
// Private cache and rate limit are scoped to the signed-in account, not the section roster.
export const reserve=mutationGeneric({args:{hash:v.string()},handler:async(ctx,{hash})=>{
 const user=await requireAccount(ctx);if(user.role!=='student'&&user.role!=='instructor')throw new Error('Not authorized.');validateHash(hash);
 const cache=await ctx.db.query('insightCache').withIndex('by_owner_hash',(q:any)=>q.eq('ownerId',user._id).eq('hash',hash)).unique();const now=Date.now();
 if(cache?.status==='done')return {state:'cached' as const,choice:cache.choice||'fallback'};
 if(cache&&now-cache.updatedAt<30000)return {state:'pending' as const};
 const usage=await ctx.db.query('insightUsage').withIndex('by_owner',q=>q.eq('ownerId',user._id)).unique();
 if(usage&&now-usage.windowStart<60000&&usage.requests>=20)return {state:'limited' as const};
 if(!usage)await ctx.db.insert('insightUsage',{ownerId:user._id,windowStart:now,requests:1});else if(now-usage.windowStart>=60000)await ctx.db.patch(usage._id,{windowStart:now,requests:1});else await ctx.db.patch(usage._id,{requests:usage.requests+1});
 if(cache)await ctx.db.patch(cache._id,{status:'pending',choice:undefined,updatedAt:now});else await ctx.db.insert('insightCache',{ownerId:user._id,hash,status:'pending',updatedAt:now});
 return {state:'reserved' as const};
}});
export const complete=mutationGeneric({args:{hash:v.string(),choice},handler:async(ctx,{hash,choice})=>{
 const user=await requireAccount(ctx);if(user.role!=='student'&&user.role!=='instructor')throw new Error('Not authorized.');validateHash(hash);
 const row=await ctx.db.query('insightCache').withIndex('by_owner_hash',(q:any)=>q.eq('ownerId',user._id).eq('hash',hash)).unique();if(!row||row.status!=='pending')throw new Error('No pending insight.');await ctx.db.patch(row._id,{status:'done',choice,updatedAt:Date.now()});
}});
