type Week={start:string;load:number;band:string};
/** A missing aggregate is zero only when the complete deadline query has no items for that week. */
export function studentWeek(start:string,weeks:Week[],entries:{dueDate:string}[]):Week|null {
 const existing=weeks.find(week=>week.start===start);if(existing)return existing;
 const end=new Date(start+'T00:00:00Z');end.setUTCDate(end.getUTCDate()+7);const endDate=end.toISOString().slice(0,10);
 return entries.some(entry=>entry.dueDate>=start&&entry.dueDate<endDate)?null:{start,load:0,band:'Light'};
}
