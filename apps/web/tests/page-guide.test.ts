import {describe,it,expect} from 'vitest';
import {pageGuideText} from '../src/components/pageGuideText';
describe('page-specific guides',()=>{
 it('explains separate personal and shared student scores without mixing calculation methods',()=>{const text=pageGuideText('student','Crunch Weeks')!.join(' ');expect(text).toContain('separate count and AI estimate');expect(text).toContain('not grade weights');expect(text).toContain('unavailable estimate is not zero');expect(text).toContain('Light is below 6');});
 it('describes current instructor and admin heatmap controls and scope',()=>{const instructor=pageGuideText('instructor','Crunch Weeks')!.join(' '),admin=pageGuideText('admin','Crunch Weeks')!.join(' ');expect(instructor).toContain('assigned section');expect(instructor).toContain('scroll sideways');expect(instructor).toContain('previous table');expect(admin).toContain('fewer than five');expect(admin).toContain('deadline type filters');});
 it('uses relevant instructions for other pages and no unrelated generic fallback',()=>{expect(pageGuideText('student','Timeline')!.join(' ')).toContain('Work without due dates');expect(pageGuideText('instructor','Sections')!.join(' ')).toContain('Delete asks for confirmation');expect(pageGuideText('student','Classroom')!.join(' ')).toContain('refresh');expect(pageGuideText('admin','Unknown')).toBeUndefined();});
});
