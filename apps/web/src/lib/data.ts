export type Kind = 'quiz' | 'activity' | 'exam' | 'performance';
export type Deadline = { id: string; subject: string; title: string; type: Kind; weekStart: number; weekEnd: number; day: number; weightPercent: number; major: boolean; estimated?: boolean; source?: string };
export const TERM_START = '2026-10-12';
export const sampleDeadlines: Deadline[] = [
 {id:'1',subject:'MATH 201',title:'Quiz 4',type:'quiz',weekStart:8,weekEnd:8,day:1,weightPercent:10,major:false},
 {id:'2',subject:'CSEL 302',title:'Midterm exam',type:'exam',weekStart:8,weekEnd:8,day:3,weightPercent:25,major:true},
 {id:'3',subject:'ITEC 210',title:'Project demo',type:'performance',weekStart:8,weekEnd:8,day:4,weightPercent:30,major:true},
 {id:'4',subject:'GE 105',title:'Reading response',type:'activity',weekStart:9,weekEnd:9,day:1,weightPercent:5,major:false},
 {id:'5',subject:'ITEC 220',title:'Lab 6',type:'performance',weekStart:9,weekEnd:9,day:3,weightPercent:10,major:true},
 {id:'6',subject:'MATH 201',title:'Practice quiz',type:'quiz',weekStart:7,weekEnd:7,day:2,weightPercent:10,major:false},
 {id:'7',subject:'GE 105',title:'Reflection',type:'activity',weekStart:7,weekEnd:7,day:4,weightPercent:5,major:false},
 {id:'8',subject:'GE 105',title:'Reading journal',type:'activity',weekStart:10,weekEnd:10,day:2,weightPercent:5,major:false},
];
export const weights: Record<Kind, number> = {quiz:1,activity:2,exam:3,performance:4};
export function dateFor(week:number, day=0) { const d=new Date(TERM_START+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+(week-1)*7+day); return d; }
export function shortDate(d:Date) { return d.toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}); }
export function range(week:number) { const a=dateFor(week), b=dateFor(week,6); return `${shortDate(a)}–${a.getUTCMonth()===b.getUTCMonth()?b.getUTCDate():shortDate(b)}`; }
export function dateLabel(d:Deadline) { return dateFor(d.weekStart,d.day).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'UTC'}); }
export function weekItems(items:Deadline[],week:number) { return items.filter(d=>d.weekStart===week); }
export function load(items:Deadline[]) { return items.reduce((sum,d)=>sum+weights[d.type]*(1+d.weightPercent/100),0); }
export function band(n:number) { return n>=10?'Critical':n>=6?'Heavy':'Light'; }
export function breakdown(items:Deadline[]) { const types:Kind[]=['exam','performance','quiz','activity']; return types.map(t=>{const n=items.filter(i=>i.type===t).length; return n?`${n} ${t}${n!==1&&t!=='performance'?'s':''}`:''}).filter(Boolean).join(' · ') || 'No deadlines'; }
