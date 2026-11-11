import type {CourseResult} from './Classroom';
export type Category='quiz'|'activity'|'exam';
export type Deadline={id:string;course:string;title:string;dueDate:string;sourceUrl?:string;workType:string;updatedAt:number};
export type Estimates=Record<string,Category|null>;
// Use only the student's own live Classroom response. Never merge teacher or other students' tasks.
export function studentDeadlines(courses:CourseResult[]):Deadline[]{
 const found=new Map<string,Deadline>();
 for(const {course,work,error} of courses){if(error)continue;for(const w of work){if(!w.dueDate)continue;const id=JSON.stringify([course.googleCourseId,w.googleCourseWorkId]);found.set(id,{id,course:course.name,title:w.title,dueDate:w.dueDate,sourceUrl:w.sourceUrl,workType:w.workType||'UNKNOWN',updatedAt:w.updatedAt});}}
 return Array.from(found.values()).sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.title.localeCompare(b.title));
}
export function estimateKey(item:Deadline){return JSON.stringify([item.id,item.updatedAt]);}
// Missing classifications are never treated as zero or guessed as a real category.
export function estimatedScore(items:Deadline[],estimates:Estimates):number|null{
 let total=0;for(const item of items){const category=estimates[estimateKey(item)];if(!category)return null;total+=({quiz:1,activity:2,exam:3}[category]);}return total;
}
// Retained for consumers of the old personal-work helper.
export function personalDatedWork(courses:CourseResult[],confirmedIds:string[],start:string,end:string){
 const known=new Set(confirmedIds);
 return courses.flatMap(({course,work,error})=>error?[]:work.filter(w=>!known.has(JSON.stringify([course.googleCourseId,w.googleCourseWorkId]))).map(w=>({...w,courseName:course.name})))
  .filter(w=>w.dueDate&&w.dueDate>=start&&w.dueDate<=end).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
}
