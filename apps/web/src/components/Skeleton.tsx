import React from 'react';

type Variant='page'|'list'|'inline';
/** Decorative placeholders with one accessible loading announcement. */
export default function Skeleton({variant='list',label='Loading content'}:{variant?:Variant;label?:string}) {
 return <div className={`skeleton skeleton--${variant}`} role="status" aria-busy="true" aria-label={label}>
  <span className="sr-only">{label}</span>
  <div aria-hidden="true">
   {variant==='page'?<><div className="skeleton-line skeleton-title"/><div className="skeleton-line skeleton-subtitle"/><div className="skeleton-page-grid"><div className="skeleton-card"><div className="skeleton-line skeleton-medium"/><div className="skeleton-block"/><div className="skeleton-line"/></div><div className="skeleton-card"><div className="skeleton-line skeleton-medium"/><div className="skeleton-line"/><div className="skeleton-line skeleton-short"/></div></div></>:variant==='inline'?<><div className="skeleton-line skeleton-medium"/><div className="skeleton-line skeleton-short"/></>:Array.from({length:4},(_,i)=><div className="skeleton-row" key={i}><div className="skeleton-line skeleton-medium"/><div className="skeleton-line skeleton-short"/></div>)}
  </div>
 </div>;
}
