import {describe,it,expect} from 'vitest';
import {personalDatedWork,studentDeadlines,estimateKey,estimatedScore} from '../src/components/classroomDashboard';
import type {CourseResult} from '../src/components/Classroom';
const work=(id:string,dueDate?:string)=>({googleCourseId:'course',googleCourseWorkId:id,title:id,state:'PUBLISHED' as const,dueDate,updatedAt:1});
describe('student personal Classroom view',()=>{
 it('shows only the student’s dated, unscored work in the requested period without duplicating confirmed work',()=>{
  const courses:CourseResult[]=[{course:{googleCourseId:'course',name:'Math'},error:false,work:[work('confirmed','2026-11-10'),work('personal','2026-11-11'),work('undated'),work('later','2026-12-01')]},{course:{googleCourseId:'failed',name:'Unavailable'},error:true,work:[work('error','2026-11-10')]}];
  const actual=personalDatedWork(courses,[JSON.stringify(['course','confirmed'])],'2026-11-09','2026-11-15');expect(actual.map(x=>x.title)).toEqual(['personal']);expect(actual[0].courseName).toBe('Math');
 });
});

describe('automatic student deadline breakdown',()=>{
 it('shows student-visible work regardless of instructor confirmation and deduplicates by class and work',()=>{
  const courses:CourseResult[]=[{course:{googleCourseId:'course',name:'Math'},error:false,work:[work('one','2026-11-10'),work('one','2026-11-10'),work('missing-date'),work('two','2026-11-12')]},{course:{googleCourseId:'other',name:'Other'},error:true,work:[]}];
  const items=studentDeadlines(courses);expect(items.map(i=>i.title)).toEqual(['one','two']);expect(items[0].course).toBe('Math');
  const estimates={[estimateKey(items[0])]:'quiz' as const,[estimateKey(items[1])]:'exam' as const};expect(estimatedScore(items,estimates)).toBe(4);expect(estimatedScore(items,{[estimateKey(items[0])]:'quiz'})).toBeNull();
  expect(estimatedScore([],{})).toBe(0);
 });
});

describe('personal Classroom score availability',()=>{
 it('does not confuse unconfirmed tasks, disconnected accounts or partial data with zero',async()=>{
  const {classroomWeekEstimate}=await import('../src/components/classroomDashboard');
  const course:CourseResult={course:{googleCourseId:'course',name:'Math'},error:false,work:[work('quiz','2026-11-10')]};
  const items=studentDeadlines([course]);const state={courses:[course],loading:false,error:'',synced:true};
  expect(classroomWeekEstimate(state,items,{})).toBeNull();
  expect(classroomWeekEstimate(state,items,{[estimateKey(items[0])]:'quiz'})).toBe(1);
  expect(classroomWeekEstimate(state,[],{})).toBe(0);
  expect(classroomWeekEstimate({...state,courses:null},[],{})).toBeNull();
  expect(classroomWeekEstimate({...state,courses:[{...course,error:true}]},[],{})).toBeNull();
  expect(classroomWeekEstimate({...state,error:'Refresh failed'},items,{[estimateKey(items[0])]:'quiz'})).toBeNull();
  expect(classroomWeekEstimate({...state,error:'Shared sync failed',synced:false},items,{[estimateKey(items[0])]:'quiz'})).toBeNull();
 });
});
