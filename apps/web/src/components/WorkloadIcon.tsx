import React from 'react';
export default function WorkloadIcon({band}:{band:string}) {
 return <svg className="workload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{band==='Critical'?<><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 17h.01"/></>:band==='Heavy'?<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>}</svg>;
}
