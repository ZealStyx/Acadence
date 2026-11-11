import {describe,it,expect} from 'vitest';
import {studentInsightSummary,entryContribution} from '../src/lib/studentInsight';
import type {Facts} from '../src/lib/insightText';

describe('student shared-workload explanation',()=>{
 const facts:Facts={weekStart:'2026-11-09',load:4.3,band:'Light',entries:[{title:'Quiz',type:'quiz',dueDate:'2026-11-10',weightPercent:10,major:false},{title:'Project',type:'activity',dueDate:'2026-11-10',weightPercent:60,major:true}]};
 it('explains the score, recorded types and a crowded day',()=>{const text=studentInsightSummary(facts);expect(text).toContain('4.3');expect(text).toContain('1 quiz');expect(text).toContain('1 activity');expect(text).toContain('2 deadlines fall on 2026-11-10');});
 it('uses the shared scoring weights and handles empty or unknown entries safely',()=>{expect(entryContribution('quiz',10)).toBeCloseTo(1.1);expect(entryContribution('activity',60)).toBeCloseTo(3.2);expect(entryContribution('unknown',10)).toBeNull();expect(studentInsightSummary({...facts,load:0,entries:[]})).toContain('No shared deadlines');});
});
