/** Read-only Classroom API helpers. The student prototype calls these on the server
 * with a short-lived Google access token held only in memory.
 * These helpers do not persist or log tokens.
 */
export class ClassroomHttpError extends Error {
 constructor(public readonly status:number){super(`Classroom request failed (${status}).`);this.name='ClassroomHttpError';}
}
const BASE='https://classroom.googleapis.com/v1/';
const MAX_PAGES=100;
type Fetcher=typeof fetch;
export type StudentCourse={googleCourseId:string;name:string};
export type StudentCoursework={googleCourseId:string;googleCourseWorkId:string;title:string;state:'PUBLISHED';dueDate?:string;sourceUrl?:string;updatedAt:number};

async function pages(path:string,params:URLSearchParams,field:string,token:string,fetcher:Fetcher):Promise<unknown[]>{
 if(!token)throw new Error('Classroom access token is missing.');
 const result:unknown[]=[];const seen=new Set<string>();
 for(let i=0;i<MAX_PAGES;i++){
  const url=new URL(path,BASE);url.search=params.toString();
  const response=await fetcher(url,{headers:{Authorization:`Bearer ${token}`},cache:'no-store'});
  if(!response.ok)throw new ClassroomHttpError(response.status);
  const body:unknown=await response.json();
  if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('Invalid Classroom response.');
  const data=body as Record<string,unknown>,records=data[field];
  if(records!==undefined&&!Array.isArray(records))throw new Error('Invalid Classroom response.');
  result.push(...(records||[]));
  const next=data.nextPageToken;
  if(next===undefined||next==='')return result;
  if(typeof next!=='string'||seen.has(next))throw new Error('Invalid Classroom pagination.');
  seen.add(next);params.set('pageToken',next);
 }
 throw new Error('Classroom pagination limit exceeded.');
}
function record(value:unknown):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid Classroom record.');
 return value as Record<string,unknown>;
}
function requiredString(value:unknown):string{if(typeof value!=='string'||!value.trim())throw new Error('Invalid Classroom record.');return value;}
function dueDate(value:unknown):string|undefined{
 if(value===undefined)return undefined;
 const date=record(value),{year,month,day}=date;
 if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day))throw new Error('Invalid Classroom due date.');
 const y=year as number,m=month as number,d=day as number;
 if(y<1||y>9999||m<1||m>12||d<1||d>31)throw new Error('Invalid Classroom due date.');
 const formatted=`${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const parsed=new Date(`${formatted}T00:00:00Z`);
 if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==formatted)throw new Error('Invalid Classroom due date.');
 return formatted;
}
function classroomUrl(value:unknown):string|undefined{
 if(value===undefined)return undefined;
 if(typeof value!=='string')throw new Error('Invalid Classroom link.');
 try{const url=new URL(value);if(url.protocol==='https:'&&url.hostname==='classroom.google.com'&&!url.username&&!url.password)return url.toString();}catch{/* invalid URL */}
 throw new Error('Invalid Classroom link.');
}
export async function listStudentCourses(token:string,fetcher:Fetcher=fetch):Promise<StudentCourse[]>{
 const data=await pages('courses',new URLSearchParams({studentId:'me',courseStates:'ACTIVE',pageSize:'100'}),'courses',token,fetcher);
 return data.map(item=>{const c=record(item);return {googleCourseId:requiredString(c.id),name:requiredString(c.name)};});
}
export async function listStudentCoursework(token:string,courseId:string,fetcher:Fetcher=fetch):Promise<StudentCoursework[]>{
 if(!courseId||courseId==='.'||courseId==='..')throw new Error('Invalid Classroom course ID.');
 const data=await pages(`courses/${encodeURIComponent(courseId)}/courseWork`,new URLSearchParams({courseWorkStates:'PUBLISHED',pageSize:'100'}),'courseWork',token,fetcher);
 return data.map(item=>{
  const w=record(item);
  // Defense in depth: never import a draft or deleted item from a student response.
  if(w.state!=='PUBLISHED')throw new Error('Unexpected Classroom coursework state.');
  const updatedAt=Date.parse(requiredString(w.updateTime));
  if(Number.isNaN(updatedAt))throw new Error('Invalid Classroom update time.');
  return {googleCourseId:courseId,googleCourseWorkId:requiredString(w.id),title:requiredString(w.title),state:'PUBLISHED' as const,dueDate:dueDate(w.dueDate),sourceUrl:classroomUrl(w.alternateLink),updatedAt};
 });
}
