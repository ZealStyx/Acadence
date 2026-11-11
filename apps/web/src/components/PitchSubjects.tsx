'use client';
import {useMemo,useState} from 'react';
import {useQuery} from 'convex/react';
import {anyApi} from 'convex/server';
type Course={_id:string;subject:string;name:string;academicSectionId?:string;instructorId:string;demoBatchKey?:string};
type Section={_id:string;code:string;term:string;demoBatchKey?:string};
type Account={_id:string;name:string;demoBatchKey?:string};
export default function PitchSubjects(){
 const courses=useQuery(anyApi.sections.list,{}) as Course[]|undefined;
 const sections=useQuery(anyApi.sections.listAcademic,{}) as Section[]|undefined;
 const accounts=useQuery(anyApi.accounts.list,{}) as Account[]|undefined;
 const [search,setSearch]=useState('');
 const rows=useMemo(()=>{if(!courses||!sections||!accounts)return null;return courses.filter(c=>c.demoBatchKey==='acadence-pitch-demo-v1').map(c=>({course:c,section:sections.find(s=>s._id===c.academicSectionId&&s.demoBatchKey==='acadence-pitch-demo-v1'),instructor:accounts.find(a=>a._id===c.instructorId)})).filter(r=>`${r.course.subject} ${r.course.name} ${r.section?.code||''} ${r.instructor?.name||''}`.toLowerCase().includes(search.trim().toLowerCase()));},[courses,sections,accounts,search]);
 return <><header className="staff-header"><h1>Pitch demo subjects</h1><p>Synthetic course offerings stored in Convex, not connected Classroom subjects. Course titles are illustrative.</p></header><section className="card staff-panel"><label className="field">Search subject, section or instructor<input value={search} onChange={e=>setSearch(e.target.value)}/></label><h2>Demo offerings</h2>{!rows?<p role="status">Loading demo subjects…</p>:rows.length?rows.map(({course,section,instructor})=><div className="group-row" key={course._id}><span><strong>{course.subject} · {course.name}</strong><small>{section?`${section.code} · ${section.term}`:'Demo section unavailable'} · {instructor?.name||'Instructor unavailable'}{instructor?.demoBatchKey?' (synthetic instructor)':''}</small></span></div>):<p>No demo offerings found. Seed the demo batch or adjust your search.</p>}</section></>;
}
