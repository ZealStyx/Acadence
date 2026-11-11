'use client';
import {useEffect,useState} from 'react';
import {firebaseAuth} from '@/lib/firebase';
import {renderInsight,type Facts} from '@/lib/insightText';
type Insight={explanation:string;actions:string[];source:string};
export default function InsightCard({facts,sectionId,proposal,title='Why this week?'}:{facts:Facts;sectionId?:string;proposal?:unknown;title?:string}){
 const signature=JSON.stringify({weekStart:facts.weekStart,sectionId,proposal,facts});
 const [result,setResult]=useState<{signature:string;value:Insight}|null>(null);
 const [settled,setSettled]=useState<string|null>(null);
 useEffect(()=>{
  let live=true;const controller=new AbortController();
  void (async()=>{try{
   const user=firebaseAuth?.currentUser;if(!user)return;
   const response=await fetch('/api/insights/explain',{method:'POST',headers:{Authorization:`Bearer ${await user.getIdToken()}`,'Content-Type':'application/json'},body:JSON.stringify({weekStart:facts.weekStart,sectionId,proposal}),cache:'no-store',signal:controller.signal});
   if(!response.ok)return;const data=await response.json();
   if(live&&typeof data.explanation==='string'&&Array.isArray(data.actions))setResult({signature,value:data});
  }catch{/* The local guidance remains available. */}finally{if(live)setSettled(signature)}})();
  return()=>{live=false;controller.abort()};
 },[signature]);
 const view=result?.signature===signature?result.value:renderInsight(facts,'fallback');
 const loading=settled!==signature;
 return <section className="card dash-panel insight-card"><h2>{title}</h2><div aria-live="polite"><p>{view.explanation}</p><ul>{view.actions.map((action,i)=><li key={i}>{action}</li>)}</ul><p>{loading?'Updating guidance…':view.source==='ai'?'AI-assisted guidance from your workload data · Advisory':'Guidance based on your workload data · Advisory'}</p></div></section>;
}
