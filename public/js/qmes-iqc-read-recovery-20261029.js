/* Retry transient IQC read failures only. Writes are never replayed. */
(()=>{'use strict';
if(window.__qmesIqcReadRecovery)return;window.__qmesIqcReadRecovery=true;
const original=window.fetch;
function target(input,options){try{const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);return url.origin===location.origin&&url.pathname==='/api/iqc'&&String(options?.method||input?.method||'GET').toUpperCase()==='GET';}catch(_){return false;}}
window.fetch=async function(input,options){
 if(!target(input,options))return original.apply(this,arguments);
 const signal=options?.signal||input?.signal;
 for(let attempt=0;attempt<3;attempt++){
  if(signal?.aborted)throw new DOMException('Aborted','AbortError');
  try{const response=await original.call(this,input,options);
   if(![502,503,504].includes(response.status)||attempt===2)return response;
  }catch(error){if(error.name==='AbortError'||signal?.aborted||attempt===2)throw error;}
  await new Promise((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},[600,1500][attempt]);signal?.addEventListener('abort',stop,{once:true});});
 }
};
})();