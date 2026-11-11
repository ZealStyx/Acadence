import {describe,expect,it} from 'vitest';
import {selectRetainedResult} from '../src/hooks/useRetainedResult';

describe('retained workload results',()=>{
 it('shows previous data with its original key while a new query is pending',()=>{
  const previous={key:'week A',value:[{load:7}]};
  expect(selectRetainedResult(undefined,'week B',previous)).toEqual({key:'week A',value:previous.value,updating:true});
  expect(selectRetainedResult([{load:2}],'week B',previous)).toEqual({key:'week B',value:[{load:2}],updating:false});
 });
 it('treats empty results as loaded and distinguishes the first load',()=>{
  expect(selectRetainedResult(undefined,'week A',undefined)).toEqual({value:undefined,key:undefined,updating:false});
  expect(selectRetainedResult([],'week B',{key:'week A',value:[1]})).toEqual({value:[],key:'week B',updating:false});
 });
});
