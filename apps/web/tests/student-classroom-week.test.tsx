import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import StudentClassroomWeek from '../src/components/StudentClassroomWeek';
import type {ClassroomState} from '../src/components/Classroom';
const state:ClassroomState={loading:false,error:'',synced:true,courses:[{course:{googleCourseId:'c1',name:'Mathematics',section:'3A',state:'ACTIVE'},error:false,work:[{googleCourseId:'c1',googleCourseWorkId:'w1',title:'Algebra',state:'PUBLISHED',dueDate:'2026-11-10',sourceUrl:'https://classroom.google.com/c/1',updatedAt:1},{googleCourseId:'c1',googleCourseWorkId:'w2',title:'Undated',state:'PUBLISHED',updatedAt:1},{googleCourseId:'c1',googleCourseWorkId:'w3',title:'Later',state:'PUBLISHED',dueDate:'2026-11-25',updatedAt:1}]}]};
const render=(classroom:ClassroomState)=>renderToStaticMarkup(<StudentClassroomWeek classroom={classroom} start="2026-11-09" end="2026-11-15" onClassroom={()=>{}}/>);
describe('student Classroom week',()=>{
 it('shows dated personal coursework for the selected week separately from section load',()=>{const html=render(state);expect(html).toContain('Algebra');expect(html).toContain('Mathematics');expect(html).not.toContain('Later');expect(html).toContain('1 published item has no due date');expect(html).toContain('separate from the shared section load');expect(html).toContain('Open in Classroom');});
 it('does not claim an empty result when a class is unavailable',()=>{const html=render({...state,courses:state.courses!.map(course=>({...course,error:true}))});expect(html).toContain('some coursework is unavailable');expect(html).not.toContain('Algebra');});
 it('shows connection and loading states',()=>{expect(render({...state,courses:null,loading:false})).toContain('Connect Google Classroom');expect(render({...state,courses:null,loading:true})).toContain('Loading Classroom coursework');});
});
