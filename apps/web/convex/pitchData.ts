// All subject titles are illustrative, not claims about LSPU's curriculum.
export const BATCH='acadence-pitch-demo-v1';
// One additional offering in each of these sections is assigned to the showcase instructor.
export const additionalShowcaseSections=[0,1,4] as const;
export const TERM='1st Semester AY 2026–2027';
const extraSubjects=['GEC 108','GEE 103','PATHFit 2','RIZAL 101','NSTP 2'] as const;
export const sections=[
 {college:'CAS',code:'BSPsych 1A',program:'BSPsych',year:1,size:16,subjects:['PSYC 101','PSYC 102','GEC 101','PATHFit 1']},
 {college:'CBAA',code:'BSBA-FM 2B',program:'BSBA-FM',year:2,size:16,subjects:['FM 201','BA 201','GEC 102','GEE 101']},
 {college:'CCS',code:'BSInfoTech-WMAD 3A',program:'BSInfoTech-WMAD',year:3,size:32,subjects:['ITEC 301','ITEC 302','ITEP 301','GEC 103']},
 {college:'CCJE',code:'BSCrim 2B',program:'BSCrim',year:2,size:16,subjects:['CRIM 201','CLJ 201','CDI 201','GEC 104']},
 {college:'COE',code:'BSCpE 2A',program:'BSCpE',year:2,size:16,subjects:['CPE 201','ENGG 201','MATH 201','GEC 105']},
 {college:'CIT',code:'BSIT-AD 3A',program:'BSIT-AD',year:3,size:16,subjects:['TECH AD 301','TECH AD 302','INDTECH 301','GEE 102']},
 {college:'CIHTM',code:'BSHM 2A',program:'BSHM',year:2,size:16,subjects:['THC 201','HM 201','HPC 201','GEC 106']},
 {college:'CTE',code:'BSEd 2A',program:'BSEd',year:2,size:16,subjects:['PROFED 201','EDUC 201','SCI 201','GEC 107']},
 {college:'GSAR',code:'MAEd 1A',program:'MAEd',year:1,size:16,subjects:['DEMO GSAR A','DEMO GSAR B','DEMO GSAR C','DEMO GSAR D']},
].map((section,index)=>({...section,subjects:[...section.subjects,...extraSubjects.slice(0,index%2===0?5:4)]}));
export function assessmentsFor(sectionIndex:number){
 const result:{week:number;day:number;course:number;type:'quiz'|'activity'|'exam';title:string;weightPercent:number;major:boolean}[]=[];
 for(let week=0;week<8;week++)for(let j=0;j<2;j++)result.push({week,day:(week+j*2)%5,course:(week+j)%4,type:j?'activity':'quiz',title:`Illustrative ${j?'activity':'quiz'} ${week+1}`,weightPercent:j?10:5,major:false});
 if(sectionIndex===2||sectionIndex===4)for(let j=0;j<3;j++)result.push({week:1,day:j+1,course:j,type:'exam',title:`Illustrative collision exam ${j+1}`,weightPercent:20,major:true});
 if(sectionIndex===1||sectionIndex===7)for(let j=0;j<2;j++)result.push({week:3,day:j+2,course:j,type:'activity',title:`Illustrative project ${j+1}`,weightPercent:15,major:true});
 return result;
}
export const counts={sections:sections.length,students:160,instructors:9,courses:sections.reduce((n,s)=>n+s.subjects.length,0),assessments:sections.reduce((n,s,i)=>n+assessmentsFor(i).length+s.subjects.length-4,0),snapshots:0,reviews:0};
