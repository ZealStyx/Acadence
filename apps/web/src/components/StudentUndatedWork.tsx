'use client';
import React from 'react';
import type {ClassroomState} from './Classroom';
import {studentUndatedWork} from './classroomDashboard';
import Skeleton from './Skeleton';

export default function StudentUndatedWork({classroom,onClassroom}:{classroom:ClassroomState;onClassroom:()=>void}) {
 const courses=classroom.courses;
 const partial=!!courses?.some(course=>course.error);
 const items=studentUndatedWork(courses||[]);
 return <section className="card figma-panel undated-work" aria-label="Coursework without due dates">
  <h2>Work without due dates</h2>
  <p>Published Classroom coursework without a due date is not included in weekly scores. Its type does not need instructor confirmation to appear here.</p>
  {classroom.loading&&!courses?<Skeleton variant="inline" label="Loading undated coursework"/>:!courses?<><p>{classroom.error||'Connect Google Classroom to see coursework without due dates.'}</p><button type="button" className="secondary" onClick={onClassroom}>Manage Classroom</button></>:<>
   {classroom.error&&<p role="status">{classroom.error}</p>}
   {partial&&<p role="status">Some classes are unavailable; this list may be incomplete.</p>}
   {items.length?<div className="stack compact-list" role="region" aria-label="Undated Classroom coursework" tabIndex={0}>{items.map(item=><article key={item.id} className="classroom-week-item"><strong>{item.title}</strong><p>{item.course} · No due date · Type not assessed here</p>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</article>)}</div>:<p>{partial?'No undated work found in available classes.':'No published Classroom work without a due date.'}</p>}
  </>}
 </section>;
}
