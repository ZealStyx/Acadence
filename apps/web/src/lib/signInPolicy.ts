import {allowedEmail, normalizeEmail} from '../../convex/access';

// This client-side check keeps rejected users on the sign-in page. Convex still
// independently enforces the same policy for every authenticated operation.
export function canEnterWithEmail(email:string|null|undefined):boolean {
 return typeof email==='string' && allowedEmail(normalizeEmail(email));
}
