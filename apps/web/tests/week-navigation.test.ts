import {describe,it,expect} from 'vitest';
import {moveWeek,shiftWeek} from '../src/lib/weekNavigation';

describe('week navigation',()=>{
 it('moves one week at a time across months and years',()=>{expect(shiftWeek('2026-12-28',1)).toBe('2027-01-04');expect(shiftWeek('2027-01-04',-1)).toBe('2026-12-28');});
 it('moves from the selected week, not the first displayed week',()=>{const initial={windowStart:'2026-11-09',selected:'2026-11-23'};expect(moveWeek(initial,1)).toEqual({windowStart:'2026-11-09',selected:'2026-11-30'});expect(moveWeek(initial,-1)).toEqual({windowStart:'2026-11-09',selected:'2026-11-16'});});
 it('shifts the visible window only when necessary and supports repeated navigation',()=>{let value={windowStart:'2026-11-09',selected:'2026-11-30'};value=moveWeek(value,1);expect(value).toEqual({windowStart:'2026-11-16',selected:'2026-12-07'});value=moveWeek(value,-1);value=moveWeek(value,-1);value=moveWeek(value,-1);value=moveWeek(value,-1);expect(value).toEqual({windowStart:'2026-11-09',selected:'2026-11-09'});});
});
