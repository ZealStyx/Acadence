import React from 'react';
import Badge from './WorkloadBadge';

type SummaryRow = {id:string;code:string;weeks:{start:string;band:string}[]};
const format=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'});
export default function SectionWorkloadSummary({rows,starts}:{rows:SummaryRow[];starts:string[]}) {
 return <div className="section-workload-scroll" role="region" aria-label="Upcoming section workload, scroll horizontally to see all weeks" tabIndex={0}>
  <table className="section-workload-table">
   <thead><tr><th scope="col">Section</th>{starts.map(start=><th scope="col" key={start}>{format(start)}</th>)}</tr></thead>
   <tbody>{rows.map(row=><tr key={row.id}><th scope="row">{row.code}</th>{starts.map(start=>{const week=row.weeks.find(w=>w.start===start);return <td key={start}>{week?<Badge band={week.band}/>:<span aria-label="Not available">—</span>}</td>})}</tr>)}</tbody>
  </table>
 </div>;
}
