'use client';
import React from 'react';
import type {ClassroomState} from './Classroom';
import {studentDeadlines} from './classroomDashboard';
import Skeleton from './Skeleton';

/** Personal Classroom items are displayed separately and never added to shared section scores. */
export default function StudentClassroomWeek({classroom,start,end,onClassroom}:{classroom:ClassroomState;start:string;end:string;onClassroom:()=>void}) {
 const courses=classroom.courses;
 const items=studentDeadlines(courses||[]).filter(item=>item.dueDate>=start&&item.dueDate<=end);
 const partial=!!courses?.some(course=>course.error);
 const undated=(courses||[]).reduce((count,course)=>count+(course.error?0:course.work.filter(item=>!item.dueDate).length),0);
 return <section className="card figma-panel classroom-week" aria-label="Your Classroom coursework">
  <h2>Google Classroom deadlines</h2>
  <p>Personal Classroom coursework is separate from the shared section load and may overlap with section deadlines.</p>
  {classroom.loading&&!courses?<Skeleton variant="inline" label="Loading Classroom coursework"/>:!courses?<><p>{classroom.error||'Connect Google Classroom to see your personal coursework here.'}</p><button type="button" className="secondary" onClick={onClassroom}>{classroom.error?'Manage connection':'Connect Classroom'}</button></>:<>
   {classroom.error&&<p role="status">{classroom.error}</p>}
   {partial&&<p role="status">Some classes could not be loaded. Showing available coursework only; refresh in Classroom.</p>}
   {items.length?<div className="stack compact-list" role="region" aria-label="Classroom deadlines this week" tabIndex={0}>{items.map(item=><article className="classroom-week-item" key={item.id}><strong>{item.title}</strong><p>{item.course} · Due {item.dueDate}</p>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</article>)}</div>:<p>{partial?'No dated items available for this week; some coursework is unavailable.':'No dated Classroom coursework for this week.'}</p>}
   {undated>0&&<p>{undated} published {undated===1?'item has':'items have'} no due date. View them in Classroom.</p>}
   <button type="button" className="secondary" onClick={onClassroom}>View or refresh Classroom</button>
  </>}
 </section>;
}
