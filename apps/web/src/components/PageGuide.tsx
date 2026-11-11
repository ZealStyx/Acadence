'use client';
import {useEffect,useState} from 'react';
import {pageGuideText,type GuideRole} from './pageGuideText';
export default function PageGuide({userId,page,role}:{userId:string;page:string;role:GuideRole}){
 const key=`pulso-page-guide:${userId}:${page}`;const [open,setOpen]=useState(true),[ready,setReady]=useState(false);
 useEffect(()=>{try{setOpen(localStorage.getItem(key)!=='closed')}catch{setOpen(true)}setReady(true)},[key]);
 const paragraphs=pageGuideText(role,page);if(!paragraphs)return null;
 return <details className="card page-guide" open={open} onToggle={event=>{if(!ready)return;const next=event.currentTarget.open;setOpen(next);try{localStorage.setItem(key,next?'open':'closed')}catch{/* Preferences can remain local to this page. */}}}><summary>How to read this page</summary>{paragraphs.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</details>;
}
