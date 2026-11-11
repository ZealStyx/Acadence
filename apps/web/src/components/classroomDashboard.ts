import type {CourseResult} from './Classroom';

// Personal API results stay in the student's browser and never become shared scores.
export function personalDatedWork(courses:CourseResult[],confirmedIds:string[],start:string,end:string){
 const known=new Set(confirmedIds);
 return courses.flatMap(({course,work,error})=>error?[]:work.filter(w=>!known.has(JSON.stringify([course.googleCourseId,w.googleCourseWorkId]))).map(w=>({...w,courseName:course.name})))
  .filter(w=>w.dueDate&&w.dueDate>=start&&w.dueDate<=end).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
}
