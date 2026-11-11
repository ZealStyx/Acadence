import {weekStart} from '../../../convex/calculations';
import type {StudentCoursework} from '../../../convex/classroomGoogle';
// Persist only counts per week, not private assignment titles or identifiers.
export function studentWeeklyCounts(work:StudentCoursework[]){
 const seen=new Set<string>(),counts=new Map<string,number>();
 for(const item of work){if(!item.dueDate||seen.has(item.googleCourseWorkId))continue;seen.add(item.googleCourseWorkId);const start=weekStart(item.dueDate);counts.set(start,(counts.get(start)||0)+1)}
 return Array.from(counts,([start,count])=>({start,count})).sort((a,b)=>a.start.localeCompare(b.start));
}
