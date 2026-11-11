export type Entry={title:string;type:string;dueDate:string;weightPercent:number;major:boolean;subject?:string};
export type Facts={weekStart:string;load:number;band:string;entries:Entry[];suggestion?:{date:string;load:number;band:string}};
export type Choice='balance'|'prioritize'|'pace'|'fallback';
export function renderInsight(facts:Facts,choice:Choice){
 const items=[...facts.entries].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.title.localeCompare(b.title));
 const subjectGroups=(['major','minor'] as const).map(kind=>{const names=Array.from(new Set(items.filter(item=>item.subject&&item.major===(kind==='major')).map(item=>String(item.subject).replace(/\s+/g,' ').slice(0,40)))).slice(0,2);return names.length?`${kind==='major'?'Major':'Minor'} deadlines: ${names.join(', ')}.`:''}).filter(Boolean);
 const explanation=[`This week is ${facts.band.toLowerCase()} with a workload score of ${facts.load.toFixed(1)} from ${items.length} recorded ${items.length===1?'deadline':'deadlines'}.`,...subjectGroups].join(' ');
 const actions:string[]=[];
 if(items.length)actions.push(`Start with ${items[0].title}, due ${items[0].dueDate}.`);else actions.push('Review your upcoming deadlines.');
 if(facts.suggestion)actions.push(`Consider ${facts.suggestion.date}: its projected load is ${facts.suggestion.load.toFixed(1)} (${facts.suggestion.band.toLowerCase()}).`);
 else {const counts=new Map<string,number>();for(let i=0;i<7;i++){const date=new Date(facts.weekStart+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+i);counts.set(date.toISOString().slice(0,10),0)}for(const item of items)if(counts.has(item.dueDate))counts.set(item.dueDate,(counts.get(item.dueDate)||0)+1);const lightest=[...counts.entries()].sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]))[0];if(lightest)actions.push(`Consider ${lightest[0]} for preparation; it has ${lightest[1]} recorded deadlines.`);}
 actions.push(choice==='pace'?'Break work into manageable sessions.':choice==='prioritize'?'Prioritize work with the nearest deadline.':'Spread preparation across the week.');
 return {explanation,actions,source:choice==='fallback'?'template':'ai'};
}
