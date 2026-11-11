import {describe,expect,it} from 'vitest';
import {studentWeek} from '../src/lib/studentWeek';
describe('student section weeks',()=>{
 it('presents a genuinely empty week as light without making up deadlines',()=>{
  expect(studentWeek('2026-11-09',[],[{dueDate:'2026-11-16'}])).toEqual({start:'2026-11-09',load:0,band:'Light'});
 });
 it('does not call a populated week empty when its score is unavailable',()=>{
  expect(studentWeek('2026-11-09',[],[{dueDate:'2026-11-10'}])).toBeNull();
  expect(studentWeek('2026-11-09',[{start:'2026-11-09',load:4,band:'Light'}],[{dueDate:'2026-11-10'}])?.load).toBe(4);
 });
});
