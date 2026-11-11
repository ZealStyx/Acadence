import {describe,it,expect} from 'vitest';
import {classroomError} from '../src/components/classroomErrors';
import {ClassroomHttpError} from '../convex/classroomGoogle';
describe('Classroom connection diagnostics',()=>{
 it('distinguishes popup errors and does not expose raw provider messages',()=>{
  expect(classroomError({code:'auth/user-mismatch'},'popup')).toContain('same Google account');
  expect(classroomError({code:'auth/popup-blocked'},'popup')).toContain('blocked');
  expect(classroomError({code:'auth/unknown',message:'secret token'},'popup')).not.toContain('secret');
 });
 it('explains API and network failures without exposing tokens',()=>{
  expect(classroomError(new ClassroomHttpError(403),'courses')).toContain('403');
  expect(classroomError(new ClassroomHttpError(401),'courses')).toContain('401');
  expect(classroomError(new TypeError('secret'),'courses')).not.toContain('secret');
 });
});
