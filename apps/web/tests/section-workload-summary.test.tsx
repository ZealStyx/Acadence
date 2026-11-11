import React from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import SectionWorkloadSummary from '../src/components/SectionWorkloadSummary';

describe('upcoming section workload',()=>{
 it('renders one labelled row per section with a column for each requested week',()=>{
  const html=renderToStaticMarkup(<SectionWorkloadSummary starts={['2026-11-09','2026-11-16','2026-11-23']} rows={[
   {id:'a',code:'BSInfoTech-WMAD 3A',weeks:[{start:'2026-11-09',band:'Critical'},{start:'2026-11-16',band:'Light'},{start:'2026-11-23',band:'Heavy'}]},
   {id:'b',code:'BSPsych 1A',weeks:[{start:'2026-11-09',band:'Light'}]},
  ]}/>);
  expect(html).toContain('scope="col">Nov 9');
  expect(html).toContain('scope="row">BSInfoTech-WMAD 3A');
  expect(html.match(/<tr>/g)).toHaveLength(3);
  expect(html.match(/<td>/g)).toHaveLength(6);
  expect(html).toContain('Critical');expect(html).toContain('Not available');
 });
});
