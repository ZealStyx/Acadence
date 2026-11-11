'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {firebaseAuth} from '@/lib/firebase';
import type {ClassroomState} from '../components/Classroom';
import {estimateKey,studentDeadlines,type Estimates} from '../components/classroomDashboard';

/** Classifications are private, session-only estimates; no scores or categories are saved to shared records. */
export function useClassroomEstimates(classroom:ClassroomState,start:string,end:string){
 const deadlines=useMemo(()=>studentDeadlines(classroom.courses||[]),[classroom.courses]);
 const [estimates,setEstimates]=useState<Estimates>({});
 const [loading,setLoading]=useState(false),[retry,setRetry]=useState(0);
 const cache=useRef<Estimates>({}),source=useRef(classroom.courses);
 useEffect(()=>{
  if(source.current!==classroom.courses){source.current=classroom.courses;cache.current={};setEstimates({});}
  if(!classroom.courses){setLoading(false);return;}
  const pending=deadlines.filter(item=>item.dueDate>=start&&item.dueDate<=end&&!(estimateKey(item) in cache.current));
  if(!pending.length){setLoading(false);return;}
  const controller=new AbortController();let live=true;
  setLoading(true);
  void (async()=>{
   for(let i=0;i<pending.length;i+=5){
    const batch=pending.slice(i,i+5);
    try{
     const user=firebaseAuth?.currentUser;if(!user)throw Error('Sign in required');
     const response=await fetch('/api/classroom/recommend',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},body:JSON.stringify({items:batch.map(item=>({title:item.title.slice(0,200),description:'',workType:item.workType.slice(0,80)}))}),cache:'no-store',signal:controller.signal});
     if(!response.ok)throw Error('Estimates unavailable');
     const data=await response.json();if(!live)return;
     for(const [index,item] of batch.entries()){
      const result=data.results?.[index];
      cache.current[estimateKey(item)]=result?.source==='ai'&&['quiz','activity','exam'].includes(result.category)?result.category:null;
     }
    }catch{if(!live)return;for(const item of batch)cache.current[estimateKey(item)]=null;}
    if(live)setEstimates({...cache.current});
   }
  })().finally(()=>{if(live)setLoading(false)});
  return()=>{live=false;controller.abort()};
 },[classroom.courses,deadlines,start,end,retry]);
 function retryEstimates(){for(const key of Object.keys(cache.current))if(cache.current[key]===null)delete cache.current[key];setEstimates({...cache.current});setRetry(n=>n+1);}
 const error=deadlines.some(item=>item.dueDate>=start&&item.dueDate<=end&&estimates[estimateKey(item)]===null)?'Some AI categories are unavailable. Your coursework is still shown.':'';
 return {deadlines,estimates,loading,error,retryEstimates};
}
