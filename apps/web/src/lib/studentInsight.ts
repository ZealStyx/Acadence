import {weights, type Kind} from '../../convex/calculations';
import type {Facts} from './insightText';

/** Describe recorded facts only; the calculation remains owned by the shared workload logic. */
export function studentInsightSummary(facts:Facts) {
 const count=facts.entries.length;
 if(!count)return `No shared deadlines are recorded for this week. Its workload score is ${facts.load.toFixed(1)} (${facts.band.toLowerCase()}).`;
 const counts=new Map<string,number>();
 for(const entry of facts.entries)counts.set(entry.type,(counts.get(entry.type)||0)+1);
 const breakdown=[...counts].sort(([a],[b])=>a.localeCompare(b)).map(([type,n])=>`${n} ${type}${n===1?'':'s'}`).join(', ');
 const dates=new Map<string,number>();
 for(const entry of facts.entries)dates.set(entry.dueDate,(dates.get(entry.dueDate)||0)+1);
 const busiest=[...dates].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0];
 return `This week is ${facts.band.toLowerCase()} (${facts.load.toFixed(1)} points) from ${count} shared ${count===1?'deadline':'deadlines'}: ${breakdown}.${busiest[1]>1?` ${busiest[1]} deadlines fall on ${busiest[0]}.`:''} Assessment type and grade weight determine the score.`;
}
export function entryContribution(type:string,weightPercent:number) {
 const weight=weights[type as Kind];
 return typeof weight==='number'&&Number.isFinite(weightPercent)?weight*(1+weightPercent/100):null;
}
