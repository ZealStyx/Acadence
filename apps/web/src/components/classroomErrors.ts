import {ClassroomHttpError} from '../../convex/classroomGoogle';

// Do not display raw provider messages: they may contain sensitive request details.
export function classroomError(error:unknown,stage:'popup'|'courses'):string {
 if(stage==='popup'){
  const code=typeof error==='object'&&error!==null&&'code' in error&&typeof error.code==='string'?error.code:'';
  const messages:Record<string,string>={
   'auth/popup-blocked':'The browser blocked the Google popup. Allow popups for this site and try again.',
   'auth/popup-closed-by-user':'The Google popup was closed before connecting. Try again and allow access.',
   'auth/cancelled-popup-request':'The Google popup was cancelled. Close other sign-in popups and try again.',
   'auth/user-mismatch':'Choose the same Google account you used to sign in to Pulso.',
   'auth/unauthorized-domain':'This website domain is not authorized in Firebase Authentication. Ask an administrator to add it under authorized domains.',
   'auth/operation-not-allowed':'Google sign-in is not enabled in Firebase Authentication.',
   'auth/network-request-failed':'Could not reach Google. Check your internet connection and try again.',
   'auth/account-exists-with-different-credential':'This email is linked to a different sign-in method in Firebase.',
  };
  return messages[code]||'Google authorization could not be completed. Check popup permissions, consent-screen test users, and school restrictions. (Step: Google popup)';
 }
 if(error instanceof ClassroomHttpError){
  if(error.status===401)return 'Google access expired or was not granted. Connect Classroom again. (Classroom API: 401)';
  if(error.status===403)return 'Google denied Classroom access. Check that the Classroom API is enabled for the Firebase Google project, the required read-only scopes were granted, and your school permits the app. (Classroom API: 403)';
  return `Google Classroom returned HTTP ${error.status}. Try again. (Step: loading classes)`;
 }
 if(error instanceof TypeError)return 'Could not reach the Classroom API. Check your connection or browser restrictions. (Step: loading classes)';
 return 'Could not load classes from Google Classroom. (Step: loading classes)';
}
