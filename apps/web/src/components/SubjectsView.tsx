'use client';
import Skeleton from './Skeleton';
import {accountName,courseName} from '../lib/displayNames';
import {useMemo,useState} from 'react';
import {useQuery} from 'convex/react';
import {anyApi} from 'convex/server';
type Course={_id:string;subject:string;name:string;academicSectionId?:string;instructorId:string;demoBatchKey?:string};
type Section={_id:string;code:string;term:string;demoBatchKey?:string};
type Account={_id:string;name:string;demoBatchKey?:string};
export default function SubjectsView(){
 const courses=useQuery(anyApi.sections.list,{}) as Course[]|undefined;
 const sections=useQuery(anyApi.sections.listAcademic,{}) as Section[]|undefined;
 const accounts=useQuery(anyApi.accounts.list,{}) as Account[]|undefined;
 const [search,setSearch]=useState('');
 const rows=useMemo(()=>{if(!courses||!sections||!accounts)return null;return courses.filter(c=>c.demoBatchKey==='acadence-pitch-demo-v1').map(c=>({course:c,section:sections.find(s=>s._id===c.academicSectionId&&s.demoBatchKey==='acadence-pitch-demo-v1'),instructor:accounts.find(a=>a._id===c.instructorId)})).filter(r=>`${r.course.subject} ${r.course.name} ${r.section?.code||''} ${r.instructor?.name||''}`.toLowerCase().includes(search.trim().toLowerCase()));},[courses,sections,accounts,search]);
 return <div className="management-workspace"><header className="staff-header"><h1>Subjects</h1><p>Explore subjects by section and instructor.</p></header><section className="card staff-panel management-panel"><label className="field">Search subject, section or instructor<input value={search} onChange={e=>setSearch(e.target.value)}/></label><h2>Course offerings</h2><div className="compact-list management-list" role="region" aria-label="Course offerings" tabIndex={0}>{!rows?<Skeleton label="Loading course offerings"/>:rows.length?rows.map(({course,section,instructor})=><div className="group-row" key={course._id}><span><strong>{course.subject} · {courseName(course.name)}</strong><small>{section?`${section.code} · ${section.term}`:'Section unavailable'} · {instructor?accountName(instructor.name,!!instructor.demoBatchKey):'Instructor unavailable'}</small></span></div>):<p>No subjects found. Try another search.</p>}</div></section></div>;
}
