import {defineSchema, defineTable} from 'convex/server';
import {v} from 'convex/values';
export default defineSchema({
 users:defineTable({name:v.string(),email:v.string(),contact:v.optional(v.string())}),
 sections:defineTable({name:v.string(),program:v.string(),yearLevel:v.string()}),
 enrollments:defineTable({userId:v.id('users'),sectionId:v.id('sections')}),
 termCalendar:defineTable({name:v.string(),startDate:v.string(),weeks:v.number()}),
 deadlines:defineTable({sectionId:v.id('sections'),subject:v.string(),title:v.string(),type:v.union(v.literal('quiz'),v.literal('activity'),v.literal('exam'),v.literal('performance')),weekStart:v.number(),weekEnd:v.number(),day:v.number(),estimated:v.boolean(),weightPercent:v.number(),major:v.boolean(),source:v.string()}).index('by_section',['sectionId']),
});
