/* QMES Workorder Calendar Owner V3 - ADD ONLY */
(function(){
"use strict";
function apply(){
var root=document.querySelector(".qwo1");if(!root)return;
root.classList.add("qmes-sales-ledger-v4");
var inputs=root.querySelectorAll("input");
for(var i=0;i<inputs.length;i++){
var x=inputs[i];
if(x.type==="date"||x.closest(".qwo1-period")){
var box=x.closest(".qwo1-field,.qwo1-form-field");
if(box)box.classList.add("qrl-date");
if(window.qmesFixedCalendar)window.qmesFixedCalendar.patch(x);
}}
if(window.qmesFixedCalendar)window.qmesFixedCalendar.scan(root);
}
document.addEventListener("click",function(){setTimeout(apply,0);},false);
window.addEventListener("qmes:navigate-tab",function(){setTimeout(apply,0);});
setTimeout(apply,0);setTimeout(apply,300);setTimeout(apply,1000);
})();