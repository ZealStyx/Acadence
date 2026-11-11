import React from 'react';
import HeatmapCell from './HeatmapCell';

type Cell={start:string;band:string;load:number};
type Row={id:string;label:string;detail:string;weeks:Cell[]};
function dateText(start:string){return new Date(`${start}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});}
/** The mobile view uses the same rows, selected cell and handlers as the desktop heatmap. */
export default function MobileHeatmap({rows,selectedId,selectedWeek,onSelect}:{rows:Row[];selectedId?:string;selectedWeek?:string;onSelect:(id:string,start:string)=>void}){
 return <div className="mobile-heatmap" aria-label="Section workload by week">
  {rows.map(row=><section className="mobile-heatmap-row" key={row.id} aria-label={`${row.label} workload`}>
   <h3>{row.label}</h3><p>{row.detail}</p>
   <div className="mobile-heatmap-weeks">{row.weeks.map(week=><div className="mobile-heatmap-week" key={week.start}><span>{dateText(week.start)}</span><HeatmapCell band={week.band} load={week.load} selected={selectedId===row.id&&selectedWeek===week.start} context={`${row.label}, week of ${dateText(week.start)}`} onClick={()=>onSelect(row.id,week.start)}/></div>)}</div>
  </section>)}
 </div>;
}
