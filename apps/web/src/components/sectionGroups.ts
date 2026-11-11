// Group only by the canonical section ID, never by a display label or course name.
// Rows with no section cannot be safely assigned to a section workload.
export function groupSectionRows<T extends {section:{_id:string}|null}>(rows:T[]):{id:string;row:T;rows:T[]}[]{
 const groups=new Map<string,{id:string;row:T;rows:T[]}>();
 for(const row of rows){if(!row.section)continue;const id=row.section._id;const group=groups.get(id);if(group)group.rows.push(row);else groups.set(id,{id,row,rows:[row]});}
 return Array.from(groups.values());
}
