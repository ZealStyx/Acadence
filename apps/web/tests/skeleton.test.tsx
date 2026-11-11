import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import Skeleton from '../src/components/Skeleton';
describe('loading skeleton',()=>{
 it('announces loading once and hides decorative placeholders from assistive technology',()=>{
  const html=renderToStaticMarkup(<Skeleton variant="page" label="Loading your timeline"/>);
  expect(html).toContain('role="status"');expect(html).toContain('aria-busy="true"');expect(html).toContain('aria-label="Loading your timeline"');expect(html).toContain('aria-hidden="true"');expect(html).toContain('skeleton-page-grid');
 });
 it('supports compact list and inline states',()=>{
  expect(renderToStaticMarkup(<Skeleton/>)).toContain('skeleton-row');
  expect(renderToStaticMarkup(<Skeleton variant="inline"/>)).toContain('skeleton--inline');
 });
});
