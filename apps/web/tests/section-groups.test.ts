import {describe,it,expect} from 'vitest';
import {groupSectionRows} from '../src/components/sectionGroups';

describe('section workload grouping',()=>{
 it('shows one section per ID without double-counting multiple assigned subjects',()=>{
  const entries=[{id:'a',section:{_id:'section-1',code:'BSPsych 1A'},weeks:[{load:7}],studentCount:16},{id:'b',section:{_id:'section-1',code:'BSPsych 1A'},weeks:[{load:7}],studentCount:16},{id:'c',section:{_id:'section-2',code:'BSCrim 2B'},weeks:[{load:3}],studentCount:16}];
  const groups=groupSectionRows(entries);expect(groups.map(g=>g.row.section?.code)).toEqual(['BSPsych 1A','BSCrim 2B']);expect(groups[0].rows.map(r=>r.id)).toEqual(['a','b']);expect(groups[0].row.weeks[0].load).toBe(7);expect(groups.reduce((n,g)=>n+g.row.studentCount,0)).toBe(32);
 });
 it('keeps distinct sections with identical names separate and excludes unmapped courses',()=>{
  const groups=groupSectionRows([{section:{_id:'fall',code:'1A'},course:'x'},{section:{_id:'spring',code:'1A'},course:'y'},{section:null,course:'unmapped'}]);expect(groups.map(g=>g.id)).toEqual(['fall','spring']);expect(groups.map(g=>g.rows.length)).toEqual([1,1]);
 });
});
