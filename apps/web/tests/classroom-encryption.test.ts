import {describe,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {seal,unseal,challenge} from '../src/lib/server/classroom';
describe('Classroom credential encryption',()=>{
 it('encrypts with random IVs and rejects another UID or tampering',()=>{
  process.env.CLASSROOM_ENCRYPTION_KEY=Buffer.alloc(32,7).toString('base64');
  process.env.GOOGLE_CLASSROOM_CLIENT_ID='test';process.env.GOOGLE_CLASSROOM_CLIENT_SECRET='test';
  process.env.CLASSROOM_REDIRECT_URI='https://example.com/api/classroom/callback';process.env.NEXT_PUBLIC_CONVEX_URL='https://example.convex.cloud';
  const a=seal('secret-refresh','refresh:alice'),b=seal('secret-refresh','refresh:alice');
  expect(a).not.toEqual(b);expect(a).not.toContain('secret-refresh');expect(unseal(a,'refresh:alice')).toBe('secret-refresh');
  expect(()=>unseal(a,'refresh:bob')).toThrow();
  const parts=a.split('.');parts[2]=Buffer.from('tampered').toString('base64url');expect(()=>unseal(parts.join('.'),'refresh:alice')).toThrow();
  expect(challenge('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
 });
});
