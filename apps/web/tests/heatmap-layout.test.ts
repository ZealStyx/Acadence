import {describe,expect,it} from 'vitest';
import {heatmapWidth,selectedHeatmapWeek} from '../src/lib/heatmapLayout';
describe('stable heatmap layout',()=>{
 it('keeps the same pixel width for a given number of weeks regardless of labels',()=>{
  expect(heatmapWidth(6)).toBe(696);
  expect(heatmapWidth(8)).toBe(868);
 });
 it('preserves a selection in range and falls back to the displayed range otherwise',()=>{
  const weeks=['2026-11-09','2026-11-16'];
  expect(selectedHeatmapWeek(weeks,'2026-11-16')).toBe('2026-11-16');
  expect(selectedHeatmapWeek(weeks,'2026-12-07')).toBe('2026-11-09');
  expect(selectedHeatmapWeek([], '2026-12-07')).toBe('');
 });
});
