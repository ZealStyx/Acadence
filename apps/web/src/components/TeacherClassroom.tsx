'use client';
import {useCallback,useEffect,useState} from 'react';
import {useMutation,useQuery} from 'convex/react';
import {anyApi} from 'convex/server';
import {firebaseAuth} from '@/lib/firebase';
import type {StudentCourse,TeacherCoursework} from '../../convex/classroomGoogle';
type Category='quiz'|'activity'|'exam';
type Review={googleCourseId:string;googleCourseWorkId:string;category:Category};
type Row={course:StudentCourse;work:TeacherCoursework[];error:boolean};
async function request(path:string,body?:unknown){
 const user=firebaseAuth?.currentUser;if(!user)throw Error('Sign in again.');
 const response=await fetch(`/api/classroom/${path}`,{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 if(!response.ok)throw Error('Could not access Classroom. Check your connection or try reconnecting.');return response.json();
}
const key=(course:string,item:string)=>JSON.stringify([course,item]);
export default function TeacherClassroom(){
 const [courses,setCourses]=useState<Row[]|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[active,setActive]=useState('');
 const [suggestions,setSuggestions]=useState<Record<string,Category|null>>({}),[choices,setChoices]=useState<Record<string,Category>>({}),[suggesting,setSuggesting]=useState(false);
 const reviews=useQuery(anyApi.classroom.reviews,{}) as Review[]|undefined,confirm=useMutation(anyApi.classroom.confirmReview);
 const load=useCallback(async()=>{const result=await request('load');setCourses(result.connected?result.courses:null);if(result.connected&&!result.synced)setError('Classes loaded, but shared Classroom sync is unavailable. Contact the administrator to configure sync.');},[]);
 useEffect(()=>{let live=true;void load().catch(()=>{if(live)setError('Could not load your connection. Check setup or reconnect.');}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[load]);
 useEffect(()=>{const url=new URL(window.location.href);const result=url.searchParams.get('classroom');if(result){url.searchParams.delete('classroom');window.history.replaceState(null,'',url.toString());if(result==='error')setError('Connection was not completed. Choose the same Google account as your Pulso sign-in.');}},[]);
 const course=courses?.find(c=>c.course.googleCourseId===active)||courses?.[0];
 useEffect(()=>{
  if(!course||!course.work.length)return;let live=true;const work=course.work;
  setSuggesting(true);
  void (async()=>{const updated:Record<string,Category|null>={};for(let i=0;i<work.length;i+=5){const batch=work.slice(i,i+5);const response=await request('recommend',{items:batch.map(w=>({title:w.title.slice(0,200),description:w.description.slice(0,4000),workType:w.workType.slice(0,80)}))});batch.forEach((w,index)=>{updated[key(course.course.googleCourseId,w.googleCourseWorkId)]=response.results[index]?.category||null});}if(live)setSuggestions(previous=>({...previous,...updated}));})().catch(()=>{if(live)setError('AI suggestions are unavailable. You can still choose a category yourself.');}).finally(()=>{if(live)setSuggesting(false)});
  return()=>{live=false};
 },[course]);
 async function connect(){setBusy(true);setError('');try{const result=await request('start');window.location.assign(result.url)}catch(e){setError(e instanceof Error?e.message:'Could not connect.');setBusy(false)}}
 async function refresh(){setBusy(true);setError('');try{await load()}catch{setError('Could not refresh. Reconnect if Google access expired.')}finally{setBusy(false)}}
 async function disconnect(){setBusy(true);setError('');try{const result=await request('disconnect');setCourses(null);if(!result.revoked)setError('Removed from Pulso, but Google could not confirm revocation. Remove access in your Google Account.')}catch{setError('Could not disconnect.')}finally{setBusy(false)}}
 async function save(work:TeacherCoursework,category:Category){setError('');try{await confirm({googleCourseId:work.googleCourseId,googleCourseWorkId:work.googleCourseWorkId,category});setNotice('Category confirmed. Eligible course-wide work can appear in the admin subject heatmap.')}catch{setError('Could not save the review.')}}
 return <><header className="staff-header"><h1>Google Classroom review</h1><p>Review your published Classroom coursework and confirm its Pulso category.</p></header><section className="card staff-panel"><h2>Your teacher courses</h2><p>Connect the same Google account you use for Pulso. Task titles and descriptions are sent to Gemini for category suggestions when configured. You decide the final category.</p><p>Confirmed course-wide work with a due date can appear in the admin subject heatmap once enough connected students have refreshed this subject. Refresh after Classroom changes.</p>{loading?<p>Checking connection…</p>:!courses?<button className="primary" disabled={busy} onClick={()=>void connect()}>{busy?'Connecting…':'Connect Google Classroom'}</button>:<><button className="primary" disabled={busy} onClick={()=>void refresh()}>Refresh classes</button>{' '}<button className="secondary" disabled={busy} onClick={()=>void disconnect()}>Disconnect</button></>}{error&&<p className="notice" role="alert">{error}</p>}{notice&&<p className="notice" role="status">{notice}</p>}</section>
 {courses&&<><label className="field">Classroom course<select value={course?.course.googleCourseId||''} onChange={e=>{setActive(e.target.value);setNotice('')}}>{courses.map(c=><option key={c.course.googleCourseId} value={c.course.googleCourseId}>{c.course.name}{c.course.section?` · ${c.course.section}`:''} · {c.course.courseState||'Unknown status'}</option>)}</select></label>{!courses.length?<p>No active, provisioned, or archived teacher courses found for this account.</p>:course?.error?<p>Could not load coursework. Reconnect if needed.</p>:!course?.work.length?<p>No published coursework found.</p>:<div className="stack">{course.work.map(w=>{const id=key(w.googleCourseId,w.googleCourseWorkId),review=reviews?.find(r=>r.googleCourseId===w.googleCourseId&&r.googleCourseWorkId===w.googleCourseWorkId),guess=suggestions[id],value=choices[id]||review?.category||guess||'';return <article className="card staff-panel" key={id}><h2>{w.title}</h2><p>Classroom type: {w.workType.replaceAll('_',' ')} · {w.dueDate?`Due ${w.dueDate}`:'No due date'}</p><p>{guess?`AI suggestion: ${guess}`:suggesting?'Checking for AI suggestion…':'AI suggestion unavailable; choose a category.'}</p>{review&&<p>Confirmed: {review.category}</p>}<label className="field">Pulso category<select value={value} onChange={e=>setChoices(prev=>({...prev,[id]:e.target.value as Category}))}><option value="">Choose a category</option><option value="quiz">Quiz</option><option value="activity">Activity</option><option value="exam">Exam</option></select></label><button className="primary" disabled={!value} onClick={()=>void save(w,value as Category)}>Confirm category</button>{' '}{w.sourceUrl&&<a href={w.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</article>})}</div>}</>}
 </>;
}
