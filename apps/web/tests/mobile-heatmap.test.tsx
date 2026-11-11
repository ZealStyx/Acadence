import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import MobileHeatmap from '../src/components/MobileHeatmap';

describe('mobile section workload',()=>{
 it('shows all section weeks with identifiable, accessible selected cells',()=>{
  const html=renderToStaticMarkup(<MobileHeatmap rows={[{id:'a',label:'IT 3A',detail:'32 students',weeks:[{start:'2026-11-09',band:'Heavy',load:7.5},{start:'2026-11-16',band:'Critical',load:11}]}]} selectedId="a" selectedWeek="2026-11-16" onSelect={()=>{}}/>);
  expect(html).toContain('IT 3A');expect(html).toContain('Nov 9, 2026');expect(html).toContain('Nov 16, 2026');expect(html).toContain('IT 3A, week of Nov 16, 2026, Critical, load 11.0');expect(html).toContain('aria-pressed="true"');expect(html).toContain('aria-pressed="false"');
 });
 it('renders missing or empty rows without fabricating cells',()=>{const html=renderToStaticMarkup(<MobileHeatmap rows={[]} onSelect={()=>{}}/>);expect(html).not.toContain('dash-cell');});
});
