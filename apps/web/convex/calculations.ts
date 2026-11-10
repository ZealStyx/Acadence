export const weights={quiz:1,activity:2,exam:3,performance:4} as const;
export type Kind=keyof typeof weights;
export function validDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
export function weekStart(value:string){if(!validDate(value))throw new Error('Use a valid date in YYYY-MM-DD format.');const d=new Date(value+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
export function addDays(value:string,days:number){const d=new Date(value+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);}
export function score(items:{type:Kind;weightPercent:number}[]){return items.reduce((n,i)=>n+weights[i.type]*(1+i.weightPercent/100),0);}
export function band(n:number){return n>=10?'Critical':n>=6?'Heavy':'Light';}
export function validateAssessment(args:{title:string;dueDate:string;weightPercent:number}){if(!args.title.trim()||args.title.trim().length>200||!validDate(args.dueDate)||!Number.isFinite(args.weightPercent)||args.weightPercent<0||args.weightPercent>100)throw new Error('Provide a title, valid date, and grade weight from 0 to 100.');}
