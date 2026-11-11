import type {Category,UnavailableReason} from '../lib/server/classify';
export type Suggestion={category:Category;source:'ai'}|{category:null;source:'unavailable';reason?:UnavailableReason};
export function suggestionMessage(result:Suggestion|undefined,loading:boolean){
 if(result?.source==='ai')return `AI suggestion: ${result.category}`;
 if(loading&&!result)return 'Checking for AI suggestion…';
 switch(result?.reason){
  case 'not_configured':return 'AI is not configured. Ask an administrator to set GEMINI_API_KEY on the web server.';
  case 'configuration_error':return 'AI configuration was rejected. Ask an administrator to check the Gemini key, model and API access.';
  case 'rate_limited':return 'AI usage limit reached. Try again later or choose a category manually.';
  case 'service_unavailable':return 'AI service could not be reached. Try again or choose a category manually.';
  case 'invalid_response':return 'AI could not provide a valid suggestion. Try again or choose a category manually.';
  default:return 'AI suggestion unavailable — choose a category.';
 }
}
