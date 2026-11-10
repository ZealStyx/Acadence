import {queryGeneric} from 'convex/server';
import {v} from 'convex/values';
import {requireAccount} from './access';
import {weekStart,score,band} from './calculations';
export const heatmap=queryGeneric({args:{weekStarts:v.array(v.string())},handler:async(ctx,{weekStarts})=>{
 await requireAccount(ctx,'admin');if(weekStarts.length<1||weekStarts.length>20||weekStarts.some(w=>weekStart(w)!==w))throw new Error('Provide up to 20 Monday week starts.');
 const students=(await ctx.db.query('accounts').collect()).filter(a=>a.role==='student'&&a.active&&a.program&&a.yearLevel);
 const groups=new Map<string,{program:string;yearLevel:number;loads:number[][]}>();
 for(const student of students){const key=JSON.stringify([student.program,student.yearLevel]);let group=groups.get(key);if(!group){group={program:student.program!,yearLevel:student.yearLevel!,loads:weekStarts.map(()=>[])};groups.set(key,group)}const links=await ctx.db.query('memberships').withIndex('by_student',q=>q.eq('studentId',student._id)).collect();const entries=(await Promise.all(links.map(l=>ctx.db.query('assessments').withIndex('by_course',q=>q.eq('courseId',l.courseId)).collect()))).flat();weekStarts.forEach((start,i)=>group!.loads[i].push(score(entries.filter(d=>weekStart(d.dueDate)===start))))}
 // Suppress small cohorts to reduce re-identification risk.
 return Array.from(groups.values()).filter(g=>g.loads[0].length>=5).map(g=>({program:g.program,yearLevel:g.yearLevel,studentCount:g.loads[0].length,weeks:weekStarts.map((start,i)=>{const averageLoad=g.loads[i].reduce((a,b)=>a+b,0)/g.loads[i].length;return {start,averageLoad,band:band(averageLoad)}})}));
}});
