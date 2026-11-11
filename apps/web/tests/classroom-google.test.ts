import {describe,it,expect,vi} from 'vitest';
import {listStudentCourses,listStudentCoursework} from '../convex/classroomGoogle';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
describe('Classroom student read helpers',()=>{
 it('fetches every active student course page using a bearer token',async()=>{
  const mock=vi.fn<typeof fetch>().mockResolvedValueOnce(json({courses:[{id:'1',name:'First'}],nextPageToken:'next'})).mockResolvedValueOnce(json({courses:[{id:'2',name:'Second'}]}));
  expect(await listStudentCourses('secret',mock)).toEqual([{googleCourseId:'1',name:'First'},{googleCourseId:'2',name:'Second'}]);
  const [url,options]=mock.mock.calls[0];expect(String(url)).toContain('studentId=me');expect(String(url)).toContain('courseStates=ACTIVE');expect(options?.headers).toEqual({Authorization:'Bearer secret'});
  expect(String(mock.mock.calls[1][0])).toContain('pageToken=next');
 });
 it('maps published work, validates dates and leaves missing deadlines unscheduled',async()=>{
  const mock=vi.fn<typeof fetch>().mockResolvedValue(json({courseWork:[{id:'w1',title:'Exam',state:'PUBLISHED',updateTime:'2026-11-01T00:00:00Z',dueDate:{year:2026,month:12,day:9},alternateLink:'https://classroom.google.com/c/abc/a/def'},{id:'w2',title:'Unscheduled',state:'PUBLISHED',updateTime:'2026-11-01T00:00:00Z'}]}));
  const work=await listStudentCoursework('token','course 1',mock);expect(work[0].dueDate).toBe('2026-12-09');expect(work[1].dueDate).toBeUndefined();expect(String(mock.mock.calls[0][0])).toContain('course%201/courseWork');
 });
 it('fails closed on drafts, invalid dates or unsafe links',async()=>{
  const base={id:'w',title:'Item',state:'PUBLISHED',updateTime:'2026-11-01T00:00:00Z'};
  for(const override of [{state:'DRAFT'},{dueDate:{year:2026,month:2,day:30}},{alternateLink:'https://evil.example/'}]){
   await expect(listStudentCoursework('token','c',vi.fn<typeof fetch>().mockResolvedValue(json({courseWork:[{...base,...override}]})))).rejects.toThrow();
  }
 });
 it('does not leak response contents and fails on repeated pagination tokens',async()=>{
  await expect(listStudentCourses('token',vi.fn<typeof fetch>().mockResolvedValue(json({error:'secret token'},403)))).rejects.toThrow('Classroom request failed (403).');
  await expect(listStudentCourses('token',vi.fn<typeof fetch>().mockImplementation(async()=>json({nextPageToken:'same'})))).rejects.toThrow('Invalid Classroom pagination.');
 });
});
