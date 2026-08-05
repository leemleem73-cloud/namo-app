/* NAMO Talk temporarily disabled to reduce client load. */
window.__NAMO_TALK_DISABLED__ = true;
try {
  sessionStorage.setItem("qmes_namo_talk_open", "0");
  sessionStorage.removeItem("qmes_namo_talk_tab");
  sessionStorage.removeItem("qmes_namo_talk_room");
} catch (error) {
  /* storage may be unavailable */
}

const NamoTalkTab = ()=>null;
const NamoTalkNotifier = ()=>null;

(function hideNamoTalkControls(){
  const style = document.createElement("style");
  style.id = "qmes-namo-talk-disabled-style";
  style.textContent = `
    button[aria-label^="NAMO Talk"],
    section[aria-label="NAMO Talk"],
    [data-namo-talk],
    [data-qmes-namo-talk] {
      display:none !important;
    }
  `;
  document.head.appendChild(style);
})();
