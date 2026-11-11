export type WeekNavigation = {selected:string;windowStart:string};
export function shiftWeek(start:string,amount:number):string {
 const date=new Date(`${start}T00:00:00Z`);
 date.setUTCDate(date.getUTCDate()+amount*7);
 return date.toISOString().slice(0,10);
}
/** Move relative to the selected week, keeping the selected week in the visible window. */
export function moveWeek(state:WeekNavigation,amount:number,visibleWeeks=4):WeekNavigation {
 const selected=shiftWeek(state.selected,amount);
 const last=shiftWeek(state.windowStart,visibleWeeks-1);
 const windowStart=selected<state.windowStart?selected:selected>last?shiftWeek(selected,1-visibleWeeks):state.windowStart;
 return {selected,windowStart};
}
