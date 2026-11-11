'use client';
import {useState} from 'react';
import {useQuery} from 'convex/react';
import {anyApi} from 'convex/server';
type Item={id:string;course:string;title:string;dueDate:string;type:'quiz'|'activity'|'exam'};
function monday(){const d=new Date(),x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));x.setUTCDate(x.getUTCDate()-(x.getUTCDay()+6)%7);return x.toISOString().slice(0,10)}
function shift(s:string,n:number){const d=new Date(s+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
export default function StudentClassroomDashboard({page}:{page:string}){
 const data=useQuery(anyApi.classroom.studentConfirmed,{}) as {connected:boolean;entries:Item[]}|undefined;const [start,setStart]=useState(monday);
 if(!data)return <p role="status">Loading your workload…</p>;
 const end=shift(start,page==='Timeline'?27:6),items=data.entries.filter(x=>x.dueDate>=start&&x.dueDate<=end),score=items.reduce((n,x)=>n+({quiz:1,activity:2,exam:3}[x.type]),0);
 return <><header className="staff-header"><h1>{page==='Home'?'Your week':page==='Timeline'?'Your timeline':'Your crunch weeks'}</h1><p>Confirmed course-wide Classroom deadlines from your connected subjects.</p></header><section className="card staff-panel"><p>Connect and refresh Classroom to identify your subjects. Instructors must connect, refresh and confirm categories. Individual assignments and unconfirmed work are not included; see Classroom for the complete list.</p>{!data.connected&&<p>No Classroom subjects synced yet. Open Classroom to connect and refresh.</p>}<div className="dash-pager"><button className="secondary" onClick={()=>setStart(shift(start,-7))}>← Earlier</button><span>{start} to {end}</span><button className="secondary" onClick={()=>setStart(shift(start,7))}>Later →</button></div>{page!=='Timeline'&&<p>Workload: <strong>{score>=10?'Critical':score>=6?'Heavy':'Light'} ({score} points)</strong> · quiz 1, activity 2, exam 3</p>}</section><div className="stack">{items.length?items.map(x=><article className="card deadline" key={x.id}><div><strong>{x.course} · {x.title}</strong><p>{x.dueDate} · {x.type}</p></div></article>):<section className="card staff-panel"><p>No confirmed course-wide deadlines in this period. Missing sync or confirmation may mean this view is incomplete.</p></section>}</div></>;
}
