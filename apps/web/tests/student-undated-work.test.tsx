import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import StudentUndatedWork from '../src/components/StudentUndatedWork';
import {studentUndatedWork} from '../src/components/classroomDashboard';
import type {ClassroomState} from '../src/components/Classroom';
const state:ClassroomState={loading:false,error:'',synced:true,courses:[{course:{googleCourseId:'one',name:'Mathematics'},error:false,work:[{googleCourseId:'one',googleCourseWorkId:'x',title:'Read chapter',state:'PUBLISHED',updatedAt:1,sourceUrl:'https://classroom.google.com/c/1'},{googleCourseId:'one',googleCourseWorkId:'y',title:'Dated quiz',state:'PUBLISHED',dueDate:'2026-11-10',updatedAt:1}]}]};
const render=(classroom:ClassroomState)=>renderToStaticMarkup(<StudentUndatedWork classroom={classroom} onClassroom={()=>{}}/>);
describe('undated Classroom work',()=>{
 it('shows undated titles, subjects and links without instructor confirmation',()=>{const html=render(state);expect(html).toContain('Read chapter');expect(html).toContain('Mathematics');expect(html).toContain('Open in Classroom');expect(html).not.toContain('Dated quiz');expect(html).toContain('not included in weekly scores');});
 it('deduplicates by course and coursework id and does not hide items with the same title in different courses',()=>{const c=state.courses![0];expect(studentUndatedWork([c,c,{...c,course:{googleCourseId:'two',name:'Other'}}])).toHaveLength(2)});
 it('distinguishes incomplete, disconnected and truly empty states',()=>{expect(render({...state,courses:[{...state.courses![0],error:true}]})).toContain('this list may be incomplete');expect(render({...state,courses:null})).toContain('Connect Google Classroom');expect(render({...state,courses:[]})).toContain('No published Classroom work without a due date');});
});
