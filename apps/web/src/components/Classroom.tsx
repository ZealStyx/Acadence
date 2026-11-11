'use client';
import {useRef,useState} from 'react';
import {GoogleAuthProvider,reauthenticateWithPopup} from 'firebase/auth';
import {firebaseAuth} from '@/lib/firebase';
import {classroomError} from './classroomErrors';
import {listStudentCourses,listStudentCoursework,type StudentCourse,type StudentCoursework} from '../../convex/classroomGoogle';

type CourseResult={course:StudentCourse;work:StudentCoursework[];error:boolean};

// The Google access token lives only in this component's memory. No refresh token
// or Classroom data is stored by Pulso in this prototype.
export default function Classroom(){
 const token=useRef<string|null>(null);
 const [courses,setCourses]=useState<CourseResult[]|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(accessToken:string){
  const list=await listStudentCourses(accessToken);
  const work=await Promise.allSettled(list.map(course=>listStudentCoursework(accessToken,course.googleCourseId)));
  setCourses(list.map((course,i)=>({course,work:work[i].status==='fulfilled'?work[i].value:[],error:work[i].status==='rejected'})));
 }
 async function connect(){
  const user=firebaseAuth?.currentUser;
  if(!user){setError('Sign in again before connecting Classroom.');return;}
  setBusy(true);setError('');token.current=null;setCourses(null);
  let stage:'popup'|'courses'='popup';
  try{
   const provider=new GoogleAuthProvider();
   provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
   provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
   // Reauthentication requires the same Google account as the Firebase session.
   const result=await reauthenticateWithPopup(user,provider);
   const accessToken=GoogleAuthProvider.credentialFromResult(result)?.accessToken;
   if(!accessToken)throw new Error('Google did not provide Classroom access. Try connecting again.');
   token.current=accessToken;
   stage='courses';
   await load(accessToken);
  }catch(e){token.current=null;setCourses(null);setError(classroomError(e,stage));}
  finally{setBusy(false)}
 }
 async function refresh(){
  if(!token.current)return;
  setBusy(true);setError('');
  try{await load(token.current)}catch(e){token.current=null;setCourses(null);setError(classroomError(e,'courses'));}finally{setBusy(false)}
 }
 function disconnect(){token.current=null;setCourses(null);setError('');}
 return <>
  <header className="staff-header"><div><h1>Google Classroom</h1><p>Your active classes and published assignments, separate from your section workload.</p></div></header>
  <section className="card staff-panel">
   <h2>Your classes</h2>
   <p>Connect the same Google account you used to sign in. Pulso requests read-only access. Classroom data stays in this browser session and does not change your shared section score.</p>
   {!courses?<button className="primary" disabled={busy} onClick={()=>void connect()}>{busy?'Connecting…':'Connect Google Classroom'}</button>:<div><button className="primary" disabled={busy} onClick={()=>void refresh()}>{busy?'Refreshing…':'Refresh classes'}</button>{' '}<button className="secondary" disabled={busy} onClick={disconnect}>Disconnect from Pulso</button></div>}
   <p>Closing this view clears the connection. To revoke Google permission, use your Google Account’s third-party connections settings.</p>
   {error&&<p className="notice" role="alert">{error}</p>}
  </section>
  {courses&&<section className="stack" aria-label="Classroom classes">{courses.length===0?<div className="card staff-panel"><p>No active classes found for this Google account.</p></div>:courses.map(({course,work,error})=><article className="card staff-panel" key={course.googleCourseId}>
   <h2>{course.name}</h2>
   {error?<p role="alert">Could not load assignments for this class. Try refreshing, or reconnect if your access has expired.</p>:work.length===0?<p>No published assignments found.</p>:<div className="stack">{work.map(item=><div className="group-row" key={item.googleCourseWorkId}><span><strong>{item.title}</strong><small>{item.dueDate?`Due ${item.dueDate}`:'No due date'}</small></span>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</div>)}</div>}
  </article>)}</section>}
 </>;
}
