/** Fixed widths keep headers and cells aligned even as the date or section text changes. */
export function heatmapWidth(weekCount:number):number { return 180 + weekCount * 86; }
/** Keep the selected date whenever it is in the displayed query result. */
export function selectedHeatmapWeek(weeks:string[],selected:string):string {
 return weeks.includes(selected)?selected:weeks[0]??'';
}
