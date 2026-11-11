import {describe,it,expect} from 'vitest';
import {personalDatedWork} from '../src/components/classroomDashboard';
import type {CourseResult} from '../src/components/Classroom';
const work=(id:string,dueDate?:string)=>({googleCourseId:'course',googleCourseWorkId:id,title:id,state:'PUBLISHED' as const,dueDate,updatedAt:1});
describe('student personal Classroom view',()=>{
 it('shows only the student’s dated, unscored work in the requested period without duplicating confirmed work',()=>{
  const courses:CourseResult[]=[{course:{googleCourseId:'course',name:'Math'},error:false,work:[work('confirmed','2026-11-10'),work('personal','2026-11-11'),work('undated'),work('later','2026-12-01')]},{course:{googleCourseId:'failed',name:'Unavailable'},error:true,work:[work('error','2026-11-10')]}];
  const actual=personalDatedWork(courses,[JSON.stringify(['course','confirmed'])],'2026-11-09','2026-11-15');expect(actual.map(x=>x.title)).toEqual(['personal']);expect(actual[0].courseName).toBe('Math');
 });
});
