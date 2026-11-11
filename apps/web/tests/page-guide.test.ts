import {describe,it,expect} from 'vitest';
import {guideIsOpen} from '../src/components/guidePreference';
import {pageGuideText} from '../src/components/pageGuideText';
describe('page-specific guides',()=>{
 it('explains separate personal and shared student scores without mixing calculation methods',()=>{const text=pageGuideText('student','Crunch Weeks')!.join(' ');expect(text).toContain('separate count and AI estimate');expect(text).toContain('not grade weights');expect(text).toContain('unavailable estimate is not zero');expect(text).toContain('Light is below 6');});
 it('describes current instructor and admin heatmap controls and scope',()=>{const instructor=pageGuideText('instructor','Crunch Weeks')!.join(' '),admin=pageGuideText('admin','Crunch Weeks')!.join(' ');expect(instructor).toContain('assigned section');expect(instructor).toContain('weeks wrap');expect(instructor).toContain('previous table');expect(admin).toContain('fewer than five');expect(admin).toContain('deadline type filters');});
 it('uses relevant instructions for other pages and no unrelated generic fallback',()=>{expect(pageGuideText('student','Timeline')!.join(' ')).toContain('Work without due dates');expect(pageGuideText('instructor','Sections')!.join(' ')).toContain('Delete asks for confirmation');expect(pageGuideText('student','Classroom')!.join(' ')).toContain('refresh');expect(pageGuideText('admin','Unknown')).toBeUndefined();});
});

describe('guide preference migration',()=>{
 it('retains closed preferences, migrates them and prefers the new key',()=>{const values=new Map([['old','closed']]);const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value)}};expect(guideIsOpen(storage,'new','old')).toBe(false);expect(values.get('new')).toBe('closed');values.set('new','open');expect(guideIsOpen(storage,'new','old')).toBe(true);});
 it('retains a readable old setting even when writing is blocked',()=>{expect(guideIsOpen({getItem:(key:string)=>key==='old'?'closed':null,setItem:()=>{throw Error('quota')}},'new','old')).toBe(false)});
});
