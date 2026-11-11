'use client';
import {useEffect,useState} from 'react';

type Snapshot<T>={value:T;key:string};
/** Never associate old values with the key of a query that has not finished. */
export function selectRetainedResult<T>(value:T|undefined,key:string,previous:Snapshot<T>|undefined) {
  const current=value===undefined?previous:{value,key};
  return {value:current?.value,key:current?.key,updating:value===undefined&&!!previous};
}
/** Keep the last complete result and its query key together while a new query loads. */
export function useRetainedResult<T>(value:T|undefined,key:string) {
  const [previous,setPrevious]=useState<Snapshot<T>|undefined>();
  useEffect(()=>{if(value!==undefined)setPrevious({value,key});},[value,key]);
  return selectRetainedResult(value,key,previous);
}
