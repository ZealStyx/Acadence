import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';

// Separate tables from the earlier sample schema. No sample rows are used by these APIs.
export default defineSchema({
  accounts: defineTable({demoBatchKey:v.optional(v.string()), demoEntityKey:v.optional(v.string()),firebaseUid:v.optional(v.string()), email:v.string(), name:v.string(), contact:v.optional(v.string()), largerText:v.optional(v.boolean()), reducedMotion:v.optional(v.boolean()), darkMode:v.optional(v.boolean()), role:v.union(v.literal('student'),v.literal('instructor'),v.literal('admin')), active:v.boolean(), program:v.optional(v.string()), yearLevel:v.optional(v.number())}).index('by_email',['email']).index('by_firebase_uid',['firebaseUid']).index('by_demo_batch',['demoBatchKey']),
  demoBatches: defineTable({key:v.string(),referenceMonday:v.string(),term:v.string(),instructorId:v.id('accounts'),studentId:v.optional(v.id('accounts')),createdAt:v.number()}).index('by_key',['key']),
  bootstrap: defineTable({completed:v.boolean()}),
  academicSections: defineTable({demoBatchKey:v.optional(v.string()), demoEntityKey:v.optional(v.string()),code:v.string(), program:v.string(), yearLevel:v.number(), term:v.string()}).index('by_code_term',['code','term']).index('by_demo_batch',['demoBatchKey']),
  sectionMembers: defineTable({demoBatchKey:v.optional(v.string()), demoEntityKey:v.optional(v.string()),studentId:v.id('accounts'), academicSectionId:v.id('academicSections')}).index('by_student',['studentId']).index('by_section',['academicSectionId']).index('by_demo_batch',['demoBatchKey']),
  courses: defineTable({demoBatchKey:v.optional(v.string()), demoEntityKey:v.optional(v.string()),subject:v.string(), name:v.string(), program:v.string(), yearLevel:v.number(), instructorId:v.id('accounts'), academicSectionId:v.optional(v.id('academicSections'))}).index('by_instructor',['instructorId']).index('by_academic_section',['academicSectionId']).index('by_demo_batch',['demoBatchKey']),
  memberships: defineTable({studentId:v.id('accounts'), courseId:v.id('courses')}).index('by_student',['studentId']).index('by_course',['courseId']).index('by_student_course',['studentId','courseId']),
  assessments: defineTable({demoBatchKey:v.optional(v.string()), demoEntityKey:v.optional(v.string()),courseId:v.id('courses'), title:v.string(), type:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')), dueDate:v.string(), weightPercent:v.number(), major:v.boolean(), createdBy:v.id('accounts'), updatedAt:v.number()}).index('by_course',['courseId']).index('by_demo_batch',['demoBatchKey']),
  classroomSnapshots: defineTable({ownerId:v.id('accounts'),role:v.union(v.literal('student'),v.literal('instructor')),googleCourseId:v.string(),name:v.string(),courseState:v.optional(v.string()),section:v.optional(v.string()),syncedAt:v.number(),workAvailable:v.boolean(),weeklyCounts:v.optional(v.array(v.object({start:v.string(),count:v.number()}))),work:v.array(v.object({googleCourseWorkId:v.string(),title:v.string(),dueDate:v.optional(v.string()),assigneeMode:v.optional(v.string())}))}).index('by_owner',['ownerId']).index('by_course',['googleCourseId']),
  classroomReviews: defineTable({ownerId:v.id('accounts'),googleCourseId:v.string(),googleCourseWorkId:v.string(),category:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam')),updatedAt:v.number()}).index('by_owner',['ownerId']).index('by_owner_course_work',['ownerId','googleCourseId','googleCourseWorkId']),
  insightUsage: defineTable({ownerId:v.id('accounts'),windowStart:v.number(),requests:v.number()}).index('by_owner',['ownerId']),
  insightCache: defineTable({ownerId:v.id('accounts'),hash:v.string(),status:v.union(v.literal('pending'),v.literal('done')),choice:v.optional(v.union(v.literal('balance'),v.literal('prioritize'),v.literal('pace'),v.literal('fallback'))),updatedAt:v.number()}).index('by_owner_hash',['ownerId','hash']),
  classroomAiUsage: defineTable({ownerId:v.id('accounts'),windowStart:v.number(),requests:v.number()}).index('by_owner',['ownerId']),
  classroomConnections: defineTable({ownerId:v.id('accounts'),encryptedRefreshToken:v.string()}).index('by_owner',['ownerId']),
  // Private student-side Classroom cache. Only trusted server-side sync will populate it.
  classroomStudentCourses: defineTable({ownerId:v.id('accounts'), googleCourseId:v.string(), name:v.string(), selected:v.boolean()}).index('by_owner',['ownerId']).index('by_owner_course',['ownerId','googleCourseId']),
  classroomStudentWork: defineTable({ownerId:v.id('accounts'), googleCourseId:v.string(), googleCourseWorkId:v.string(), title:v.string(), state:v.union(v.literal('PUBLISHED'),v.literal('DRAFT'),v.literal('DELETED')), dueDate:v.optional(v.string()), sourceUrl:v.optional(v.string()), updatedAt:v.number()}).index('by_owner_course',['ownerId','googleCourseId']).index('by_owner_course_work',['ownerId','googleCourseId','googleCourseWorkId']),
  // Legacy prototype tables retained so an existing deployment can migrate without data loss.
  users:defineTable({name:v.string(),email:v.string(),contact:v.optional(v.string())}),
  sections:defineTable({name:v.string(),program:v.string(),yearLevel:v.string()}),
  enrollments:defineTable({userId:v.id('users'),sectionId:v.id('sections')}),
  termCalendar:defineTable({name:v.string(),startDate:v.string(),weeks:v.number()}),
  deadlines:defineTable({sectionId:v.id('sections'),subject:v.string(),title:v.string(),type:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')),weekStart:v.number(),weekEnd:v.number(),day:v.number(),estimated:v.boolean(),weightPercent:v.number(),major:v.boolean(),source:v.string()}).index('by_section',['sectionId']),
});
