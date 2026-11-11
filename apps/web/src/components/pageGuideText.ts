export type GuideRole='student'|'instructor'|'admin';
const bands='For shared section scores, Light is below 6 points, Heavy starts at 6, and Critical starts at 10. Scores use recorded assessment types and grade weights; missing work is not included.';
const studentClassroom='Your Classroom workload is separate from the shared section score and can include individual work. Its AI-estimated points use predicted categories, not grade weights or instructor confirmation; an unavailable estimate is not zero.';
const guides:Record<GuideRole,Record<string,string[]>>={
 student:{
  Home:['Use the arrows or select a week to change the dates. The Classroom card lists your dated coursework for the selected week; work without a due date is on Timeline.',studentClassroom,`The shared section score covers recorded deadlines for your primary section, not personal Classroom work. ${bands}`],
  Timeline:['Use the arrows to navigate weeks. Classroom work due in the selected week is shown separately; Work without due dates lists undated Classroom items. The subject and type filters apply only to shared section deadlines.',studentClassroom,bands],
  'Crunch Weeks':['Use the arrows and week cards to select a week. When you have a primary section, each card shows its shared score and, if Classroom is connected, a separate count and AI estimate for dated Classroom work; select a week to see its tasks.',studentClassroom,bands],
  Classroom:['Connect the same Google account you use to sign in, then refresh to load published coursework. Expand a class to see its tasks, including work without due dates. A partial or failed refresh can leave some work unavailable.'],
  Profile:['View your account and academic details, or open Preferences to change appearance and accessibility settings. Contact your department to correct academic information.'],
 },
 instructor:{
  Home:['Review your upcoming recorded deadlines and the section workload summary. The section score includes recorded deadlines from registered offerings, not every item visible in Classroom.',bands],
  Sections:['Choose a section and subject to view and manage its recorded deadlines. Use Add deadline or Edit to check projected section workload and suggested dates before saving; Delete asks for confirmation.',bands],
  'Crunch Weeks':['Each row represents an assigned section and each column a week. Select a cell to see that section’s contributing recorded deadlines; use the arrows to move one week. On mobile, weeks wrap under each section; on larger screens, scroll the table sideways to see more columns.',bands,'While a new range loads, the previous table remains visible. Unmapped offerings and unrecorded work are not included.'],
  Classroom:['Connect and refresh your teaching account, choose a class, and review its published coursework. AI categories are suggestions; you choose and confirm the category. Unavailable classes and sync failures may leave the view incomplete.'],
  Profile:['View or edit your profile, or open Preferences to change appearance and accessibility settings.'],
 },
 admin:{
  'Crunch Weeks':['Each row is an eligible section and each column a week. Select a cell to inspect its score; use the arrows to move one week. On mobile, weeks wrap under each section; on larger screens, scroll the table sideways to see more columns. Program, term and deadline type filters change the displayed results.',bands,'Sections with fewer than five active students are hidden. The table can show the previous range while updated results load.'],
 },
};
export function pageGuideText(role:GuideRole,page:string):string[]|undefined{return guides[role]?.[page];}
