import React from 'react';
/** Always pair workload color with both a shape and a label. */
export default function WorkloadBadge({band}:{band:string}) {
  return <span className={'chip '+band.toLowerCase()}>{band==='Critical'?'■':band==='Heavy'?'▲':'●'} {band}</span>;
}
