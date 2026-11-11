import {describe,expect,it} from 'vitest';
import {accountName,courseName} from '../src/lib/displayNames';
describe('display labels',()=>{
 it('removes seed labels without changing ordinary course names',()=>{
  expect(courseName('Illustrative MATH 201 (pitch demo)')).toBe('MATH 201');
  expect(courseName('Introduction to Mathematics')).toBe('Introduction to Mathematics');
 });
 it('only removes the seeded account prefix when the record is marked',()=>{
  expect(accountName('Demo Instructor CCS',true)).toBe('Instructor CCS');
  expect(accountName('Demo User',false)).toBe('Demo User');
 });
});
