'use client';
import {useEffect,useState} from 'react';
export default function PageGuide({userId,page}:{userId:string;page:string}){
 const key=`pulso-page-guide:${userId}:${page}`;const [open,setOpen]=useState(true),[ready,setReady]=useState(false);
 useEffect(()=>{try{setOpen(localStorage.getItem(key)!=='closed')}catch{setOpen(true)}setReady(true)},[key]);
 return <details className="card page-guide" open={open} onToggle={event=>{if(!ready)return;const next=event.currentTarget.open;setOpen(next);try{localStorage.setItem(key,next?'open':'closed')}catch{/* Preferences can remain local to this page. */}}}><summary>How to read this page</summary><p>Scores combine the type and grade weight of recorded deadlines. ● Light is below 6, ▲ Heavy starts at 6, and ■ Critical starts at 10. Select a week to see its deadlines; missing work is not included.</p></details>;
}
