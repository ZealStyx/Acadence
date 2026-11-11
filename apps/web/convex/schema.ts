import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

// Separate tables from the earlier sample schema. No sample rows are used by these APIs.
export default defineSchema({
  accounts: defineTable({firebaseUid:v.optional(v.string()), email:v.string(), name:v.string(), role:v.union(v.literal('student'),v.literal('instructor'),v.literal('admin')), active:v.boolean(), program:v.optional(v.string()), yearLevel:v.optional(v.number())}).index('by_email',['email']).index('by_firebase_uid',['firebaseUid']),
  bootstrap: defineTable({completed:v.boolean()}),
  academicSections: defineTable({code:v.string(), program:v.string(), yearLevel:v.number(), term:v.string()}).index('by_code_term',['code','term']),
  sectionMembers: defineTable({studentId:v.id('accounts'), academicSectionId:v.id('academicSections')}).index('by_student',['studentId']).index('by_section',['academicSectionId']),
  courses: defineTable({subject:v.string(), name:v.string(), program:v.string(), yearLevel:v.number(), instructorId:v.id('accounts'), academicSectionId:v.optional(v.id('academicSections'))}).index('by_instructor',['instructorId']).index('by_academic_section',['academicSectionId']),
  memberships: defineTable({studentId:v.id('accounts'), courseId:v.id('courses')}).index('by_student',['studentId']).index('by_course',['courseId']).index('by_student_course',['studentId','courseId']),
  assessments: defineTable({courseId:v.id('courses'), title:v.string(), type:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')), dueDate:v.string(), weightPercent:v.number(), major:v.boolean(), createdBy:v.id('accounts'), updatedAt:v.number()}).index('by_course',['courseId']),
  // Legacy prototype tables retained so an existing deployment can migrate without data loss.
  users:defineTable({name:v.string(),email:v.string(),contact:v.optional(v.string())}),
  sections:defineTable({name:v.string(),program:v.string(),yearLevel:v.string()}),
  enrollments:defineTable({userId:v.id('users'),sectionId:v.id('sections')}),
  termCalendar:defineTable({name:v.string(),startDate:v.string(),weeks:v.number()}),
  deadlines:defineTable({sectionId:v.id('sections'),subject:v.string(),title:v.string(),type:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')),weekStart:v.number(),weekEnd:v.number(),day:v.number(),estimated:v.boolean(),weightPercent:v.number(),major:v.boolean(),source:v.string()}).index('by_section',['sectionId']),
});
