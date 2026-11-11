import {describe,it,expect} from 'vitest';
import {canEnterWithEmail} from '../src/lib/signInPolicy';
describe('sign-in account gate',()=>{
 it('accepts LSPU addresses regardless of case or local-part shape',()=>{
  for(const email of ['student@lspu.edu.ph','  Person.Name@LSPU.EDU.PH  ','2020-1234@lspu.edu.ph'])expect(canEnterWithEmail(email)).toBe(true);
 });
 it('keeps exactly the designated Gmail administrator exceptions',()=>{
  expect(canEnterWithEmail('johnalexalcazar@gmail.com')).toBe(true);
  expect(canEnterWithEmail('alcazarjohnalex@gmail.com')).toBe(true);
  expect(canEnterWithEmail('anyone@gmail.com')).toBe(false);
 });
 it('rejects absent and deceptive addresses',()=>{
  for(const email of [null,undefined,'','no-at-sign','user@lspu.edu.ph.example.com','@lspu.edu.ph','person@other.edu.ph','bad name@lspu.edu.ph'])expect(canEnterWithEmail(email)).toBe(false);
 });
});
