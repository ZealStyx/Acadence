'use client';
import {useCallback,useEffect,useState} from 'react';
import {firebaseAuth} from '@/lib/firebase';
import type {StudentCourse,StudentCoursework} from '../../convex/classroomGoogle';

export type CourseResult={course:StudentCourse;work:StudentCoursework[];error:boolean};
async function request(path:string){
 const user=firebaseAuth?.currentUser;if(!user)throw Error('Sign in again before connecting Classroom.');
 const idToken=await user.getIdToken();
 const response=await fetch(`/api/classroom/${path}`,{method:'POST',headers:{Authorization:`Bearer ${idToken}`},cache:'no-store'});
 if(!response.ok)throw Error('Could not access Classroom. Check the server configuration or connect again.');
 return response.json();
}
export type ClassroomState={courses:CourseResult[]|null;loading:boolean;error:string;synced:boolean|null};
export default function Classroom({onChange}:{onChange?:(value:ClassroomState)=>void}){
 const [courses,setCourses]=useState<CourseResult[]|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[synced,setSynced]=useState<boolean|null>(null);
 useEffect(()=>{onChange?.({courses,loading,error,synced})},[courses,loading,error,synced,onChange]);
 const load=useCallback(async()=>{const result=await request('load');setCourses(result.connected?result.courses:null);setSynced(result.connected?!!result.synced:null);if(result.connected&&!result.synced)setError('Classes loaded, but shared sync failed. Ask the administrator to check CLASSROOM_SYNC_SECRET in Vercel and Convex and deploy the matching Convex functions.');},[]);
 useEffect(()=>{let live=true;void load().catch(()=>{if(live)setError('Could not load your saved Classroom connection. Check the server configuration or connect again.');}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[load]);
 useEffect(()=>{const url=new URL(window.location.href);const result=url.searchParams.get('classroom');if(result){url.searchParams.delete('classroom');window.history.replaceState(null,'',url.toString());if(result==='error')setError('Google Classroom connection was not completed. Use the same Google account as your Pulso sign-in and try again.');}},[]);
 async function connect(){setBusy(true);setError('');try{const result=await request('start');window.location.assign(result.url);}catch(e){setError(e instanceof Error?e.message:'Could not connect.');setBusy(false);}}
 async function refresh(){setBusy(true);setError('');try{await load()}catch{setError('Could not refresh Classroom. Your access may have been revoked or expired; reconnect and try again.')}finally{setBusy(false)}}
 async function disconnect(){setBusy(true);setError('');try{const result=await request('disconnect');setCourses(null);setSynced(null);if(!result.revoked)setError('The connection was removed from Pulso, but Google could not confirm revocation. Remove access in your Google Account’s third-party connections.');}catch{setError('Could not disconnect. Try again.')}finally{setBusy(false)}}
 return <>
  <header className="staff-header"><div><h1>Google Classroom</h1><p>Your active classes and published assignments, separate from your section workload.</p></div></header>
  <section className="card staff-panel"><h2>Your classes</h2>
   <p>Connect the same Google account you used to sign in. Pulso requests read-only access and keeps your connection when you sign out. Classroom assignments do not change your shared section score.</p>
   {loading?<p role="status">Checking your Classroom connection…</p>:!courses?<button className="primary" disabled={busy} onClick={()=>void connect()}>{busy?'Connecting…':'Connect Google Classroom'}</button>:<div><button className="primary" disabled={busy} onClick={()=>void refresh()}>{busy?'Refreshing…':'Refresh classes'}</button>{' '}<button className="secondary" disabled={busy} onClick={()=>void disconnect()}>Disconnect from Pulso</button></div>}
   <p>You can disconnect at any time. Google or your school may require you to reconnect if access expires or is revoked.</p>
   {error&&<><p className="notice" role="alert">{error}</p>{courses&&<button className="secondary" disabled={busy} onClick={()=>void connect()}>Reconnect Classroom</button>}</>}
  </section>
  {courses&&<section className="stack" aria-label="Classroom classes">{courses.length===0?<div className="card staff-panel"><p>No active classes found for this Google account.</p></div>:courses.map(({course,work,error})=><article className="card staff-panel" key={course.googleCourseId}>
   <h2>{course.name}</h2>{error?<p role="alert">Could not load assignments for this class. Try refreshing.</p>:work.length===0?<p>No published assignments found.</p>:<div className="stack">{work.map(item=><div className="group-row" key={item.googleCourseWorkId}><span><strong>{item.title}</strong><small>{item.dueDate?`Due ${item.dueDate}`:'No due date'}</small></span>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</div>)}</div>}
  </article>)}</section>}
 </>;
}
