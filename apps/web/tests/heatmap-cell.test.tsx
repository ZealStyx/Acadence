import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import HeatmapCell from '../src/components/HeatmapCell';

describe('heatmap cell',()=>{
 it.each(['Light','Heavy','Critical'])('renders %s with a score, accessible description and icon',band=>{
  const html=renderToStaticMarkup(<HeatmapCell band={band} load={7.25} selected/>);
  expect(html).toContain(`aria-label="${band}, load 7.3"`);
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('<svg');expect(html).toContain('7.3');
 });
});
