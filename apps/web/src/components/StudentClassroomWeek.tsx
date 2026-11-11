'use client';
import React from 'react';
import type {ClassroomState} from './Classroom';
import {studentDeadlines,classroomWeekEstimate,estimateKey,type Estimates} from './classroomDashboard';
import Skeleton from './Skeleton';

/** Personal Classroom items are displayed separately and never added to shared section scores. */
export default function StudentClassroomWeek({classroom,start,end,onClassroom,estimates={},estimating=false,estimateError='',onRetry}:{classroom:ClassroomState;start:string;end:string;onClassroom:()=>void;estimates?:Estimates;estimating?:boolean;estimateError?:string;onRetry?:()=>void}) {
 const courses=classroom.courses;
 const items=studentDeadlines(courses||[]).filter(item=>item.dueDate>=start&&item.dueDate<=end);
 const estimate=classroomWeekEstimate(classroom,items,estimates);
 const partial=!!courses?.some(course=>course.error);
 const undated=(courses||[]).reduce((count,course)=>count+(course.error?0:course.work.filter(item=>!item.dueDate).length),0);
 return <section className="card figma-panel classroom-week" aria-label="Your Classroom coursework">
  <h2>Your Classroom workload</h2>
  <p>Published coursework appears here even if its type has not been confirmed by an instructor. It is separate from the shared section load and may overlap with section deadlines.</p>
  {classroom.loading&&!courses?<Skeleton variant="inline" label="Loading Classroom coursework"/>:!courses?<><p>{classroom.error||'Connect Google Classroom to see your personal coursework here.'}</p><button type="button" className="secondary" onClick={onClassroom}>{classroom.error?'Manage connection':'Connect Classroom'}</button></>:<>
   {classroom.error&&<p role="status">{classroom.error}</p>}
   {partial&&<p role="status">Some classes could not be loaded. Showing available coursework only; refresh in Classroom.</p>}
   <div className="classroom-estimate" aria-live="polite"><strong>Personal Classroom estimate: {estimate===null?'—':estimate.toFixed(1)}</strong><p>{estimate===null?(estimating?'Estimating categories…':'Estimate unavailable until all dated items can be categorized and Classroom data is complete.'):'Estimated points for dated Classroom items in this week.'}</p></div>
   <p className="student-insight-note">AI estimates categories from assignment titles and Classroom work types (not descriptions). Quiz = 1, activity = 2, exam = 3 points. Estimates may be wrong, do not include grade weight, and are not added to the shared section score.</p>
   {estimateError&&<p role="status">{estimateError}</p>}{estimateError&&onRetry&&<button type="button" className="secondary" onClick={onRetry}>Retry estimate</button>}
   {items.length>0&&<p><strong>{partial?'At least ':''}{items.length} {items.length===1?'item':'items'} due this week</strong> · type not required</p>}
   {items.length?<div className="stack compact-list" role="region" aria-label="Classroom deadlines this week" tabIndex={0}>{items.map(item=><article className="classroom-week-item" key={item.id}><strong>{item.title}</strong><p>{estimates[estimateKey(item)]?`${estimates[estimateKey(item)]} · AI estimate`:'Uncategorized'} · {item.course} · Due {item.dueDate}</p>{item.sourceUrl&&<a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">Open in Classroom ↗</a>}</article>)}</div>:<p>{partial?'No dated items available for this week; some coursework is unavailable.':'No dated Classroom coursework for this week.'}</p>}
   {undated>0&&<p>{undated} published {undated===1?'item has':'items have'} no due date. View them in Classroom.</p>}
   <button type="button" className="secondary" onClick={onClassroom}>View or refresh Classroom</button>
  </>}
 </section>;
}
