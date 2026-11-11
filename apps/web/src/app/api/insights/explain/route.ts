import {ConvexHttpClient} from 'convex/browser';
import {anyApi} from 'convex/server';
import {chooseInsight,insightHash,type Facts,type Choice} from '../../../../lib/server/insights';
import {renderInsight} from '../../../../lib/insightText';
export const runtime='nodejs';
const headers={'Cache-Control':'no-store'};
export async function POST(request:Request){
 try{
  if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403,headers});
  const bearer=request.headers.get('authorization');if(!bearer?.startsWith('Bearer '))return Response.json({error:'Sign in required'},{status:401,headers});
  const url=process.env.NEXT_PUBLIC_CONVEX_URL;if(!url)throw Error('Not configured');const client=new ConvexHttpClient(url);client.setAuth(bearer.slice(7));
  let account;try{account=await client.query(anyApi.accounts.me,{})}catch{return Response.json({error:'Sign in required'},{status:401,headers})}
  if(!['student','instructor'].includes(account.role))return Response.json({error:'Not authorized'},{status:403,headers});
  const body=await request.json();const week=body?.weekStart;if(typeof week!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(week))return Response.json({error:'Invalid week'},{status:400,headers});
  const checkedWeek=new Date(week+'T00:00:00Z');if(!Number.isFinite(checkedWeek.getTime())||checkedWeek.getUTCDay()!==1||checkedWeek.toISOString().slice(0,10)!==week)return Response.json({error:'Invalid week'},{status:400,headers});
  let sectionId:string,entries:Facts['entries'],load:number,band:string,suggestion:Facts['suggestion'];
  if(account.role==='student'){
   if(body.proposal)return Response.json({error:'Not authorized'},{status:403,headers});
   const result=await client.query(anyApi.student.timeline,{});if(!result.section)return Response.json({error:'Section unavailable'},{status:404,headers});sectionId=result.section._id;
   const end=new Date(week+'T00:00:00Z');if(!Number.isFinite(end.getTime())||(end.getUTCDay()!==1)||end.toISOString().slice(0,10)!==week)throw Error('Invalid week');end.setUTCDate(end.getUTCDate()+7);const endDate=end.toISOString().slice(0,10);
   entries=result.entries.filter((x:{dueDate:string})=>x.dueDate>=week&&x.dueDate<endDate).map(({title,type,dueDate,weightPercent,major,subject}:Facts['entries'][number])=>({title,type,dueDate,weightPercent,major,subject}));const data=result.weeks.find((w:{start:string})=>w.start===week);if(!data)return Response.json({error:'Week unavailable'},{status:400,headers});load=data.load;band=data.band;
  }else{
   if(typeof body.sectionId!=='string'||body.sectionId.length>128)return Response.json({error:'Section required'},{status:400,headers});
   const overview=await client.query(anyApi.instructor.overview,{weekStarts:[week]});const row=overview.find((r:{section:{_id:string}|null})=>r.section?._id===body.sectionId);if(!row)return Response.json({error:'Section unavailable'},{status:403,headers});sectionId=row.section._id;const end=new Date(week+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);const endDate=end.toISOString().slice(0,10);
   entries=row.entries.filter((x:{dueDate:string;_id:string})=>x.dueDate>=week&&x.dueDate<endDate&&x._id!==body.proposal?.excludeId).map(({title,type,dueDate,weightPercent,major,subject}:Facts['entries'][number])=>({title,type,dueDate,weightPercent,major,subject}));load=row.weeks[0].load;band=row.weeks[0].band;
   if(body.proposal){const p=body.proposal;if(!row.course||!overview.some((r:{course:{_id:string};section:{_id:string}|null})=>r.course._id===p.courseId&&r.section?._id===sectionId))return Response.json({error:'Course unavailable'},{status:403,headers});const collision=await client.query(anyApi.assessments.collision,p);if(collision.unmapped)return Response.json({error:'Section unavailable'},{status:400,headers});const proposedWeek=new Date(p.dueDate+'T00:00:00Z');proposedWeek.setUTCDate(proposedWeek.getUTCDate()-(proposedWeek.getUTCDay()+6)%7);if(proposedWeek.toISOString().slice(0,10)!==week)return Response.json({error:'Invalid proposal week'},{status:400,headers});load=collision.current.load;band=collision.current.band;entries.push({title:'Proposed deadline',type:p.type,dueDate:p.dueDate,weightPercent:p.weightPercent,major:p.major});const better=collision.suggestions.find((s:{load:number})=>s.load<load);if(better)suggestion={date:better.date,load:better.load,band:better.band};}
  }
  entries.sort((a,b)=>a.dueDate.localeCompare(b.dueDate)||a.title.localeCompare(b.title)||String(a.subject||'').localeCompare(String(b.subject||'')));
  const facts:Facts={weekStart:week,load,band,entries,...(suggestion?{suggestion}:{})};const hash=insightHash(account.role,sectionId,facts);
  if(!process.env.GEMINI_API_KEY?.trim())return Response.json(renderInsight(facts,'fallback'),{headers});
  let reserved;try{reserved=await client.mutation(anyApi.insights.reserve,{hash})}catch{return Response.json(renderInsight(facts,'fallback'),{headers})}
  if(reserved.state==='cached')return Response.json(renderInsight(facts,reserved.choice as Choice),{headers});if(reserved.state!=='reserved')return Response.json(renderInsight(facts,'fallback'),{headers});
  const choice=await chooseInsight(facts);try{await client.mutation(anyApi.insights.complete,{hash,choice})}catch{/* Fallback remains safe if persistence is temporarily unavailable. */}
  return Response.json(renderInsight(facts,choice),{headers});
 }catch{return Response.json({error:'Insight unavailable'},{status:400,headers});}
}
