'use client';
import Skeleton from './Skeleton';
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
 const [courses,setCourses]=useState<CourseResult[]|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[synced,setSynced]=useState<boolean|null>(null),[search,setSearch]=useState(''),[lastRefreshed,setLastRefreshed]=useState<Date|null>(null),[lastSynced,setLastSynced]=useState<Date|null>(null);
 useEffect(()=>{onChange?.({courses,loading,error,synced})},[courses,loading,error,synced,onChange]);
 const load=useCallback(async()=>{const result=await request('load');setCourses(result.connected?result.courses:null);setSynced(result.connected?!!result.synced:null);setLastRefreshed(result.connected?new Date():null);if(result.connected&&result.synced)setLastSynced(new Date());else if(!result.connected)setLastSynced(null);if(result.connected&&!result.synced)setError('Classes loaded, but shared sync failed. Try refreshing or contact your administrator.');},[]);
 useEffect(()=>{let live=true;void load().catch(()=>{if(live)setError('Could not load your saved Classroom connection. Check the server configuration or connect again.');}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[load]);
 useEffect(()=>{const url=new URL(window.location.href);const result=url.searchParams.get('classroom');if(result){url.searchParams.delete('classroom');window.history.replaceState(null,'',url.toString());if(result==='error')setError('Google Classroom connection was not completed. Use the same Google account as your Pulso sign-in and try again.');}},[]);
 async function connect(){setBusy(true);setError('');try{const result=await request('start');window.location.assign(result.url);}catch(e){setError(e instanceof Error?e.message:'Could not connect.');setBusy(false);}}
 async function refresh(){setBusy(true);setError('');try{await load()}catch{setError('Could not refresh Classroom. Your access may have been revoked or expired; reconnect and try again.')}finally{setBusy(false)}}
 async function disconnect(){if(!window.confirm('Disconnect Google Classroom? Your synced Classroom data will be removed from Pulso.'))return;setBusy(true);setError('');try{const result=await request('disconnect');setCourses(null);setSynced(null);setLastRefreshed(null);setLastSynced(null);if(!result.revoked)setError('The connection was removed from Pulso, but Google could not confirm revocation. Remove access in your Google Account’s third-party connections.');}catch{setError('Could not disconnect. Try again.')}finally{setBusy(false)}}
 return <>
  <header className="staff-header"><div><span className="eyebrow-label">YOUR CONNECTION</span><h1>Google Classroom</h1><p>Your active classes and published assignments, separate from your section workload.</p></div></header>
  <section className="card staff-panel"><span className="eyebrow-label">GOOGLE CLASSROOM</span>{!loading&&<h2>{!courses?'Not connected':error?'Needs attention':!synced?'Sync unavailable':courses.some(c=>c.error)?'Partially available':'Synced'}</h2>}{courses&&<p>{courses.length} active {courses.length===1?'class':'classes'} connected.{lastRefreshed&&` Last refreshed this session: ${lastRefreshed.toLocaleString()}.`}{lastSynced?` Last synced this session: ${lastSynced.toLocaleString()}.`: ' No successful sync this session.'}</p>}
   <details className="classroom-privacy"><summary>Connection and privacy details</summary><p>Connect the same Google account you used to sign in. Pulso requests read-only access and keeps your connection when you sign out. While your connection is active, Pulso can refresh your Classroom data when an administrator opens section insights. Weekly counts of your dated assignments, including individual assignments, are included in section averages visible to admins only for groups of at least five connected students. Your assignment titles are not included in these averages. Pulso may send assignment titles and Classroom work types to Gemini for estimated categories. Disconnecting removes your synced data.</p></details>
   {loading?<Skeleton variant="inline" label="Checking your Classroom connection"/>:!courses?<button className="primary" disabled={busy} onClick={()=>void connect()}>{busy?'Connecting…':'Connect Google Classroom'}</button>:<div className="classroom-actions"><button className="primary" disabled={busy} onClick={()=>void refresh()}>{busy?'Please wait…':'Refresh classes'}</button><button className="secondary" disabled={busy} onClick={()=>void connect()}>Reconnect</button><button className="secondary" disabled={busy} onClick={()=>void disconnect()}>Disconnect from Pulso</button></div>}
   <p>You can disconnect at any time. Google or your school may require you to reconnect if access expires or is revoked.</p>
   {error&&<p className="notice" role="alert">{error}</p>}
  </section>
  {courses&&<section className="classroom-courses" aria-label="Classroom classes"><label className="field">Find a class<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search courses or sections"/></label>{courses.length===0?<div className="card staff-panel"><p>No active classes found for this Google account.</p></div>:courses.filter(({course})=>`${course.name} ${course.section||''}`.toLowerCase().includes(search.trim().toLowerCase())).length===0?<p>No classes match your search.</p>:courses.filter(({course})=>`${course.name} ${course.section||''}`.toLowerCase().includes(search.trim().toLowerCase())).map(({course,work,error})=><details className="card classroom-course" key={course.googleCourseId}>
   <summary><span><strong>{course.name}</strong><small>{course.section||'No section'} · {error?'Coursework unavailable':`${work.length} published ${work.length===1?'item':'items'}`}</small></span><span className={'status-pill '+(error?'status-pending':'status-ok')}>{error?'Needs attention':'Available'}</span></summary>
   <div className="classroom-coursework">{error?<p role="alert">Could not load assignments for this class. Try refreshing.</p>:work.length===0?<p>No published assignments found.</p>:work.map(item=><div className="group-row" key={item.googleCourseWorkId}><span><strong>{item.title}</strong><small>{item.dueDate?`Due ${item.dueDate}`:'No due date'}</small></span>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</div>)}</div>
  </details>)}</section>}
 </>;
}
