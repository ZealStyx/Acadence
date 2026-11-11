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
