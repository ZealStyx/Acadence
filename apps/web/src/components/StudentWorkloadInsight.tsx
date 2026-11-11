'use client';
import {useState} from 'react';
import InsightCard from './InsightCard';
import {entryContribution,studentInsightSummary} from '../lib/studentInsight';
import type {Facts} from '../lib/insightText';

export default function StudentWorkloadInsight({facts}:{facts:Facts}) {
 const [open,setOpen]=useState(false);
 const entries=[...facts.entries].sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.title.localeCompare(b.title));
 return <section className="card dash-panel student-insight">
  <h2>Why this week?</h2>
  <p aria-live="polite">{studentInsightSummary(facts)}</p>
  <p className="student-insight-note">Based on recorded shared section deadlines. Personal adjustments and Classroom data are not included.</p>
  <details onToggle={event=>setOpen(event.currentTarget.open)}>
   <summary>View breakdown and study plan</summary>
   <div className="student-insight-detail">
    <h3>Score breakdown</h3>
    {entries.length?<ul>{entries.map((entry,index)=>{const points=entryContribution(entry.type,entry.weightPercent);return <li key={`${entry.dueDate}-${entry.title}-${index}`}><strong>{entry.title}</strong>{entry.subject?` · ${entry.subject}`:''} · {entry.type} · {entry.weightPercent}% of grade · due {entry.dueDate}{points===null?'':` · ${points.toFixed(1)} points`}</li>})}</ul>:<p>No shared deadlines recorded for this week.</p>}
    <p>Points are based on assessment type and grade weight; displayed item values are rounded. The score may not reflect unrecorded work.</p>
    {open&&<InsightCard facts={facts} title="Suggested study plan"/>}
   </div>
  </details>
 </section>;
}
