/* QMES quality-system extensions: additive only, 2026-10-01 */
(function(){
  const h=React.createElement;
  const PREFIX="qmes_quality_ext_";
  function load(key){try{return JSON.parse(localStorage.getItem(PREFIX+key)||"[]");}catch(e){return [];}}
  function save(key,rows){try{localStorage.setItem(PREFIX+key,JSON.stringify(rows));}catch(e){}}
  function Table({kind,title,subtitle,columns}){
    const [rows,setRows]=React.useState(()=>load(kind));
    const [open,setOpen]=React.useState(false);
    const empty=Object.fromEntries(columns.map(c=>[c.key,""]));
    const [form,setForm]=React.useState(empty);
    const add=()=>{
      if(!Object.values(form).some(v=>String(v||"").trim())) return;
      const data=[{id:Date.now(),...form},...rows];
      setRows(data); save(kind,data); setForm(empty); setOpen(false);
    };
    const remove=id=>{const data=rows.filter(r=>r.id!==id);setRows(data);save(kind,data);};
    return h("section",{style:{background:"#fff",border:"1px solid #dbe3ec",borderRadius:14,padding:20,minHeight:520}},
      h("div",{style:{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",marginBottom:18}},
        h("div",null,h("h2",{style:{fontSize:22,fontWeight:900,margin:0,color:"#1f2937"}},title),h("div",{style:{fontSize:13,color:"#64748b",marginTop:5}},subtitle)),
        h("button",{type:"button",onClick:()=>setOpen(v=>!v),style:{border:"1px solid #b8c6d3",background:"#f8fafc",borderRadius:8,padding:"9px 14px",fontWeight:800,cursor:"pointer"}},open?"닫기":"신규 등록")
      ),
      open&&h("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10,padding:14,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,marginBottom:16}},
        ...columns.map(c=>h("label",{key:c.key,style:{fontSize:12,fontWeight:800,color:"#475569"}},c.label,
          h("input",{value:form[c.key]||"",onChange:e=>setForm({...form,[c.key]:e.target.value}),style:{width:"100%",marginTop:5,padding:"9px 10px",border:"1px solid #cbd5e1",borderRadius:7,background:"#fff"}})
        )),
        h("div",{style:{display:"flex",alignItems:"end"}},h("button",{type:"button",onClick:add,style:{width:"100%",padding:"10px 12px",border:0,borderRadius:8,background:"#334155",color:"#fff",fontWeight:900,cursor:"pointer"}},"저장"))
      ),
      h("div",{style:{overflowX:"auto"}},h("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13}},
        h("thead",null,h("tr",null,h("th",{style:{padding:10,borderBottom:"1px solid #cbd5e1",textAlign:"center",width:60}},"No"),...columns.map(c=>h("th",{key:c.key,style:{padding:10,borderBottom:"1px solid #cbd5e1",textAlign:"center",whiteSpace:"nowrap"}},c.label)),h("th",{style:{padding:10,borderBottom:"1px solid #cbd5e1",textAlign:"center",width:80}},"관리"))),
        h("tbody",null,rows.length?rows.map((r,i)=>h("tr",{key:r.id},h("td",{style:{padding:10,borderBottom:"1px solid #eef2f7",textAlign:"center"}},i+1),...columns.map(c=>h("td",{key:c.key,style:{padding:10,borderBottom:"1px solid #eef2f7",textAlign:"center"}},r[c.key]||"-")),h("td",{style:{padding:10,borderBottom:"1px solid #eef2f7",textAlign:"center"}},h("button",{type:"button",onClick:()=>remove(r.id),style:{border:"1px solid #d8dee6",background:"#fff",borderRadius:6,padding:"5px 9px",cursor:"pointer"}},"삭제")))):h("tr",null,h("td",{colSpan:columns.length+2,style:{padding:42,textAlign:"center",color:"#94a3b8"}},"등록된 데이터가 없습니다.")))
      ))
    );
  }
  const commonDocCols=[{label:"구분",key:"type"},{label:"문서명",key:"item"},{label:"문서번호",key:"code"},{label:"Rev.",key:"rev"},{label:"개정일",key:"date"},{label:"상태",key:"status"}];
  window.QMESMsaTab=()=>h(Table,{kind:"msa",title:"MSA / GRR 관리",subtitle:"측정시스템 분석 및 Gage R&R 기록",columns:[{label:"측정기/항목",key:"item"},{label:"분석일",key:"date"},{label:"측정자",key:"owner"},{label:"%GRR",key:"result"},{label:"판정",key:"status"}]});
  window.QMESCalibrationTab=()=>h(Table,{kind:"calibration",title:"계측기 교정관리",subtitle:"계측기 교정·점검·차기 교정일 관리",columns:[{label:"계측기명",key:"item"},{label:"관리번호",key:"code"},{label:"교정일",key:"date"},{label:"차기교정일",key:"due"},{label:"상태",key:"status"}]});
  window.QMESStandardsTab=()=>h(Table,{kind:"standards",title:"기준서 / 매뉴얼",subtitle:"수입검사 기준서 · 공정검사 기준서 · 출하검사 기준서 · 매뉴얼 관리",columns:commonDocCols});
})();