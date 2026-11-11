import React from 'react';
import WorkloadIcon from './WorkloadIcon';

export default function HeatmapCell({band,load,selected,onClick,context}:{band:string;load:number;selected?:boolean;onClick?:()=>void;context?:string}){
 return <button type="button" className={'dash-cell '+band.toLowerCase()+(selected?' selected':'')} aria-label={`${context?context+', ':''}${band}, load ${load.toFixed(1)}`} aria-pressed={selected} onClick={onClick}><WorkloadIcon band={band}/><strong>{load.toFixed(1)}</strong><span className="sr-only"> {band}</span></button>;
}
