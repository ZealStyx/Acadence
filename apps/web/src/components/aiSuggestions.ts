import type {Category,UnavailableReason} from '../lib/server/classify';
export type Suggestion={category:Category;source:'ai'}|{category:null;source:'unavailable';reason?:UnavailableReason};
export function suggestionMessage(result:Suggestion|undefined,loading:boolean){
 if(result?.source==='ai')return `AI suggestion: ${result.category}`;
 if(loading&&!result)return 'Checking for AI suggestion…';
 switch(result?.reason){
  case 'not_configured':return 'AI is not configured. Ask an administrator to set GEMINI_API_KEY on the web server.';
  case 'configuration_error':return 'The Gemini model setting is invalid. Ask an administrator to check GEMINI_CLASSIFICATION_MODEL on the web server.';
  case 'invalid_key':return 'Gemini rejected the API key. Ask an administrator to check GEMINI_API_KEY in the web deployment and redeploy.';
  case 'access_denied':return 'Gemini access was denied. Ask an administrator to check API enablement, key restrictions and project permissions.';
  case 'model_unavailable':return 'The configured Gemini model or API endpoint was not found. Ask an administrator to check GEMINI_CLASSIFICATION_MODEL and model access.';
  case 'request_rejected':return 'Gemini rejected the classification request. Ask an administrator to check the model and request settings; you can choose a category manually.';
  case 'rate_limited':return 'AI usage limit reached. Try again later or choose a category manually.';
  case 'service_unavailable':return 'AI service could not be reached. Try again or choose a category manually.';
  case 'invalid_response':return 'AI could not provide a valid suggestion. Try again or choose a category manually.';
  default:return 'AI suggestion unavailable — choose a category.';
 }
}
