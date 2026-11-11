import {anyApi} from 'convex/server';
import {bearer,checkOrigin,errorResponse,session} from '@/lib/server/classroom';
import {recommend} from '@/lib/server/classify';
export const runtime='nodejs';
export async function POST(request:Request){try{
 checkOrigin(request);const user=await session(bearer(request));if(user.role!=='instructor'&&user.role!=='student')throw Error('Student or instructor required');
 const body=await request.json();if(!Array.isArray(body.items)||body.items.length>5)throw Error('Invalid request');
 const items=body.items as unknown[];
 if(items.some(x=>!x||typeof x!=='object'||typeof (x as Record<string,unknown>).title!=='string'||typeof (x as Record<string,unknown>).description!=='string'||typeof (x as Record<string,unknown>).workType!=='string'||((x as Record<string,string>).title.length>200)||((x as Record<string,string>).description.length>4000)||((x as Record<string,string>).workType.length>80)))throw Error('Invalid request');
 await user.client.mutation(anyApi.classroom.reserveAiRequest,{});
 const results=await Promise.all((items as {title:string;description:string;workType:string}[]).map(item=>recommend(item.title,item.description,item.workType)));
 return Response.json({results},{headers:{'Cache-Control':'no-store'}});
}catch{return errorResponse();}}
