/* Shared, asynchronous confirmation and notice dialogs for all QMES menus. */
(function(){
'use strict';
if(window.qmesDialogs)return;
const queue=[];let active=null;
const style=document.createElement('style');style.id='qmes-common-dialog-style';
style.textContent=`
#qmes-common-dialog{width:360px;max-width:calc(100vw - 32px);max-height:80vh;overflow:auto;box-sizing:border-box;padding:22px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#111;box-shadow:0 16px 45px #0003;font:13px/1.6 Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif}
#qmes-common-dialog::backdrop{background:rgba(15,23,42,.32)}
#qmes-common-dialog *{box-sizing:border-box;font-family:inherit;color:#111}
#qmes-common-dialog h3{font-size:15px;font-weight:700;line-height:1.4;margin:0 0 12px}
#qmes-common-dialog p{margin:0 0 20px;white-space:pre-wrap;overflow-wrap:anywhere}
#qmes-common-dialog input{width:100%;height:36px;padding:7px 9px;margin:0 0 18px;border:1px solid #cbd5e1;border-radius:4px;font:inherit;background:#fff;color:#111}
#qmes-common-dialog footer{display:flex;justify-content:flex-end;gap:8px}
#qmes-common-dialog button{min-width:64px;height:34px;padding:0 14px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;color:#111;font:600 12px Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif;cursor:pointer}
#qmes-common-dialog button[data-accept]{background:#f3f4f6}
#qmes-common-dialog button:hover{background:#e5e7eb}
#qmes-common-dialog :focus-visible{outline:2px solid #64748b;outline-offset:2px}
html body #toast{background:#fff!important;color:#111!important;border:1px solid #d1d5db!important;box-shadow:0 6px 20px #0002!important}
html:root body :is(.iqc-delete-backdrop,.ncr-print-confirm-overlay){background:rgba(15,23,42,.32)!important}
html:root body :is(.iqc-delete-dialog,.ncr-print-confirm){background:#fff!important;color:#111!important;border:1px solid #d1d5db!important;border-radius:8px!important;box-shadow:0 16px 45px #0003!important}
html:root body :is(.iqc-delete-dialog,.ncr-print-confirm) *{color:#111!important;-webkit-text-fill-color:#111!important}
html:root body :is(.iqc-delete-dialog,.ncr-print-confirm) :is(button,[data-yes],[data-accept],[data-confirm],[data-print]){background:#fff!important;border:1px solid #cbd5e1!important;color:#111!important;border-radius:4px!important;box-shadow:none!important}
html:root body :is(.iqc-delete-dialog,.ncr-print-confirm) button:hover{background:#f3f4f6!important}
`;
document.head.appendChild(style);
function pump(){
 if(active||!queue.length)return;
 const job=queue.shift(),dialog=document.createElement('dialog'),previousFocus=document.activeElement;
 dialog.id='qmes-common-dialog';dialog.setAttribute('role',job.type==='alert'?'alertdialog':'dialog');
 dialog.setAttribute('aria-labelledby','qmes-common-dialog-title');dialog.setAttribute('aria-describedby','qmes-common-dialog-message');
 const title=document.createElement('h3');title.id='qmes-common-dialog-title';title.textContent=job.type==='alert'?'안내':job.type==='prompt'?'입력':'확인';
 const message=document.createElement('p');message.id='qmes-common-dialog-message';message.textContent=String(job.message??'');
 dialog.append(title,message);
 let input=null;
 if(job.type==='prompt'){input=document.createElement('input');input.type='text';input.value=String(job.defaultValue??'');input.setAttribute('aria-label',String(job.message??'입력'));dialog.append(input);}
 const footer=document.createElement('footer'),accept=document.createElement('button');accept.type='button';accept.dataset.accept='';accept.textContent='확인';
 const cancelValue=job.type==='confirm'?false:job.type==='prompt'?null:undefined;
 const current={dialog,done:false};active=current;
 function finish(value){
  if(current.done)return;current.done=true;
  dialog.close();dialog.remove();active=null;job.resolve(value);
  if(previousFocus?.isConnected)previousFocus.focus();
  queueMicrotask(pump);
 }
 if(job.type!=='alert'){const cancel=document.createElement('button');cancel.type='button';cancel.textContent='취소';cancel.dataset.cancel='';cancel.onclick=()=>finish(cancelValue);footer.append(cancel);}
 accept.onclick=()=>finish(job.type==='prompt'?input.value:job.type==='confirm'?true:undefined);
 footer.append(accept);dialog.append(footer);
 dialog.addEventListener('click',event=>event.stopPropagation());
 dialog.addEventListener('keydown',event=>event.stopPropagation());
 dialog.addEventListener('cancel',event=>{event.preventDefault();finish(cancelValue);});
 dialog.addEventListener('close',()=>{if(!current.done)finish(cancelValue);});
 if(input)input.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();accept.click();}});
 document.body.appendChild(dialog);dialog.showModal();
 (input||footer.firstElementChild).focus();
 if(input)input.select();
}
function show(type,message,defaultValue){return new Promise(resolve=>{queue.push({type,message,defaultValue,resolve});pump();});}
window.qmesDialogs={confirm:message=>show('confirm',message),alert:message=>show('alert',message),prompt:(message,value)=>show('prompt',message,value)};
window.qmesConfirm=window.qmesDialogs.confirm;
window.qmesPrompt=window.qmesDialogs.prompt;
window.qmesAlert=window.qmesDialogs.alert;
// Alerts have no decision value. Confirm/prompt callers explicitly await their result.
window.alert=function(message){void window.qmesAlert(message);};
})();
