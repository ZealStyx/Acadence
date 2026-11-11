import React from 'react';
import WorkloadIcon from './WorkloadIcon';
/** Always pair workload color with both a shape and a label. */
export default function WorkloadBadge({band}:{band:string}) {
  return <span className={'chip '+band.toLowerCase()}><WorkloadIcon band={band}/> {band}</span>;
}
