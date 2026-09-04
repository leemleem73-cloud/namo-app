/* QMES 회원등록 수정 버튼 안정화 패치 - 2026-09-04 */
(function installMembersEditFix(){
  const DEPARTMENTS=["대표","경영지원부","연구소","생산부","영업부","품질부"];

  MembersTab=function MembersTabEditFix(){
    const emptyCreate={name:"",dept:DEPARTMENTS[0],position:"",phone:"",email:""};
    const [users,setUsers]=useState(loadUsers);
    const [createForm,setCreateForm]=useState(emptyCreate);
    const [editForm,setEditForm]=useState(null);
    const [info,setInfo]=useState(null);

    const persist=(next)=>{ setUsers(next); saveUsers(next); };
    const text=(v)=>String(v==null?"":v).trim();

    const addMember=async()=>{
      const name=text(createForm.name);
      if(!name){setInfo({tone:"error",text:"이름을 입력해 주세요."});return;}
      if(users.some(u=>text(u.name)===name)){setInfo({tone:"error",text:"이미 등록된 이름입니다."});return;}
      const pwHash=await hashText("1234");
      const next=[...users,{
        id:name,uid:nextUid(users),pwHash,name,
        dept:createForm.dept||DEPARTMENTS[0],position:text(createForm.position),
        phone:text(createForm.phone),email:text(createForm.email),role:"user",
        passwordChanged:false,joined:new Date().toLocaleString("ko-KR",{hour12:false})
      }];
      persist(next);
      setCreateForm(emptyCreate);
      setInfo({tone:"success",text:`${name} 회원을 추가했습니다. 초기 비밀번호는 1234입니다.`});
    };

    const openEdit=(event,u)=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      setEditForm({
        originalId:u.id,
        name:u.name||"",
        dept:u.dept||DEPARTMENTS[0],
        position:u.position||"",
        phone:u.phone||"",
        email:u.email||"",
        role:u.role||"user"
      });
      setInfo(null);
    };

    const saveEdit=(event)=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if(!editForm)return;
      const name=text(editForm.name);
      if(!name){setInfo({tone:"error",text:"이름을 입력해 주세요."});return;}
      if(users.some(u=>u.id!==editForm.originalId&&text(u.name)===name)){
        setInfo({tone:"error",text:"이미 등록된 이름입니다."});return;
      }
      const next=users.map(u=>u.id===editForm.originalId?{
        ...u,
        id:name,
        name,
        dept:editForm.dept||DEPARTMENTS[0],
        position:text(editForm.position),
        phone:text(editForm.phone),
        email:text(editForm.email),
        role:u.role==="admin"?"admin":"user"
      }:u);
      persist(next);
      setEditForm(null);
      setInfo({tone:"success",text:`${name} 회원 정보를 수정했습니다.`});
    };

    const resetPw=async(event,u)=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const pwHash=await hashText("1234");
      persist(users.map(x=>x.id===u.id?{...x,pwHash,pw:undefined,passwordChanged:false}:x));
      setInfo({tone:"success",text:`${u.name} 비밀번호를 1234로 초기화했습니다.`});
    };

    const removeMember=(event,u)=>{
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if(u.role==="admin"){setInfo({tone:"error",text:"시스템 관리자 계정은 삭제할 수 없습니다."});return;}
      if(!window.confirm(`${u.name} 회원을 삭제하시겠습니까?`))return;
      persist(users.filter(x=>x.id!==u.id));
      setInfo({tone:"success",text:`${u.name} 회원을 삭제했습니다.`});
    };

    const field=(label,node)=><label className="qmf-field"><span>{label}</span>{node}</label>;
    const inputClass="qmf-input";

    return <div className="qmf-root">
      <style>{`
        .qmf-root{font-family:'Pretendard','Noto Sans KR','Malgun Gothic',Arial,sans-serif;color:#263746;font-size:14px;}
        .qmf-root *{box-sizing:border-box;font-family:inherit;}
        .qmf-notice{margin:0 0 14px;padding:11px 14px;border:1px solid #a8d7bf;border-radius:8px;background:#f3fbf7;color:#17663a;font-weight:800;}
        .qmf-notice.error{border-color:#f3b0b0;background:#fff6f6;color:#b42318;}
        .qmf-card{margin-bottom:16px;border:1px solid #d6e0e7;border-radius:9px;background:#fff;overflow:hidden;box-shadow:0 2px 8px rgba(40,72,94,.05);}
        .qmf-head{display:flex;align-items:center;justify-content:space-between;min-height:48px;padding:0 16px;border-bottom:1px solid #dce5eb;background:#fbfcfd;}
        .qmf-head h2{margin:0;font-size:16px;font-weight:900;color:#243746;}
        .qmf-count{font-size:13px;font-weight:700;color:#607483;}
        .qmf-body{padding:16px;}
        .qmf-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;align-items:end;}
        .qmf-field{display:block;min-width:0;}
        .qmf-field>span{display:block;margin-bottom:6px;font-size:13px;font-weight:800;color:#526574;}
        .qmf-input{width:100%;height:42px;padding:0 11px;border:1px solid #b8c7d2;border-radius:7px;background:#fff;color:#243746;font-size:14px;font-weight:650;outline:none;}
        .qmf-input:focus{border-color:#168bc3;box-shadow:0 0 0 3px rgba(22,139,195,.12);}
        .qmf-create-actions{display:flex;justify-content:flex-end;margin-top:12px;}
        .qmf-btn{height:34px;padding:0 11px;border-radius:6px;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap;}
        .qmf-btn.primary{border:1px solid #0c8fc6;background:#0c8fc6;color:#fff;}
        .qmf-btn.edit{border:1px solid #55b8de;background:#eef9fd;color:#086f9b;min-width:48px;}
        .qmf-btn.reset{border:1px solid #b8c6d0;background:#fff;color:#344b5a;}
        .qmf-btn.delete{border:1px solid #efaaaa;background:#fff;color:#c43c3c;}
        .qmf-btn.cancel{border:1px solid #b8c6d0;background:#fff;color:#344b5a;}
        .qmf-table-wrap{width:100%;overflow:auto;}
        .qmf-table{width:100%;min-width:1120px;border-collapse:collapse;background:#fff;}
        .qmf-table th{height:42px;padding:9px 10px;border-bottom:1px solid #cdd9e2;background:#f7f9fb;text-align:left;color:#4d6272;font-size:13px;font-weight:850;white-space:nowrap;}
        .qmf-table td{padding:11px 10px;border-bottom:1px solid #dbe4ea;color:#2b3f4e;font-size:14px;font-weight:600;vertical-align:middle;white-space:nowrap;}
        .qmf-actions{display:flex;align-items:center;gap:6px;}
        .qmf-uid{color:#1587b7!important;font-weight:800!important;}
        .qmf-name{font-weight:850!important;color:#1f3443!important;}
        .qmf-badge{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:3px 8px;border:1px solid #ccd7de;border-radius:6px;background:#f4f7f9;font-size:12px;font-weight:800;}
        .qmf-badge.admin{border-color:#c7b8ff;background:#f2efff;color:#6546c7;}
        .qmf-badge.initial{border-color:#f2cc86;background:#fff7e8;color:#a45f00;}
        .qmf-modal-bg{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.34);}
        .qmf-modal{width:min(760px,calc(100vw - 32px));max-height:calc(100vh - 48px);overflow:auto;border:1px solid #cbd8e2;border-radius:12px;background:#fff;box-shadow:0 24px 70px rgba(15,23,42,.28);}
        .qmf-modal-head{display:flex;align-items:center;justify-content:space-between;padding:15px 18px;border-bottom:1px solid #dde6ed;background:#f9fbfc;}
        .qmf-modal-head strong{font-size:17px;color:#203746;}
        .qmf-close{width:34px;height:34px;border:1px solid #c7d3dc;border-radius:7px;background:#fff;color:#405665;font-size:20px;cursor:pointer;}
        .qmf-modal-body{padding:18px;}
        .qmf-modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
        .qmf-role{height:42px;display:flex;align-items:center;padding:0 11px;border:1px solid #d1dce4;border-radius:7px;background:#f7f9fb;color:#506574;font-weight:750;}
        .qmf-modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px;}
        .qmf-modal-actions .qmf-btn{height:40px;padding:0 16px;font-size:13px;}
        @media(max-width:1100px){.qmf-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
        @media(max-width:700px){.qmf-grid,.qmf-modal-grid{grid-template-columns:1fr;}}
      `}</style>

      {info&&<div className={`qmf-notice ${info.tone==="error"?"error":""}`}>{info.text}</div>}

      <section className="qmf-card">
        <div className="qmf-head"><h2>회원 추가</h2></div>
        <div className="qmf-body">
          <div className="qmf-grid">
            {field("이름 · 로그인 ID",<input className={inputClass} value={createForm.name} onChange={e=>setCreateForm({...createForm,name:e.target.value})} placeholder="이름"/>)}
            {field("부서",<select className={inputClass} value={createForm.dept} onChange={e=>setCreateForm({...createForm,dept:e.target.value})}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select>)}
            {field("직급",<input className={inputClass} value={createForm.position} onChange={e=>setCreateForm({...createForm,position:e.target.value})} placeholder="예: 부장"/>)}
            {field("연락처",<input className={inputClass} type="tel" value={createForm.phone} onChange={e=>setCreateForm({...createForm,phone:e.target.value})} placeholder="010-0000-0000"/>)}
            {field("이메일",<input className={inputClass} type="email" value={createForm.email} onChange={e=>setCreateForm({...createForm,email:e.target.value})} placeholder="name@company.com"/>)}
          </div>
          <div className="qmf-create-actions"><button type="button" className="qmf-btn primary" onClick={addMember}>회원 추가</button></div>
        </div>
      </section>

      <section className="qmf-card">
        <div className="qmf-head"><h2>회원등록 현황</h2><span className="qmf-count">총 {users.length}명</span></div>
        <div className="qmf-table-wrap"><table className="qmf-table"><thead><tr>{["고유번호","로그인 ID·이름","부서","직급","연락처","이메일","권한","비밀번호","관리"].map(h=><th key={h}>{h}</th>)}</tr></thead>
        <tbody>{users.map(u=><tr key={u.id}>
          <td className="qmf-uid">{u.uid||"-"}</td><td className="qmf-name">{u.name}</td><td>{u.dept||"-"}</td><td>{u.position||"-"}</td><td>{u.phone||"-"}</td><td>{u.email||"-"}</td>
          <td><span className={`qmf-badge ${u.role==="admin"?"admin":""}`}>{u.role==="admin"?"관리자":"일반"}</span></td>
          <td><span className={`qmf-badge ${u.passwordChanged?"":"initial"}`}>{u.passwordChanged?"변경완료":"초기 1234"}</span></td>
          <td><div className="qmf-actions">
            <button type="button" className="qmf-btn edit" onClick={e=>openEdit(e,u)}>수정</button>
            <button type="button" className="qmf-btn reset" onClick={e=>resetPw(e,u)}>비밀번호 초기화</button>
            {u.role!=="admin"&&<button type="button" className="qmf-btn delete" onClick={e=>removeMember(e,u)}>삭제</button>}
          </div></td>
        </tr>)}</tbody></table></div>
      </section>

      {editForm&&<div className="qmf-modal-bg" role="dialog" aria-modal="true" aria-label="회원 정보 수정" onMouseDown={e=>{if(e.target===e.currentTarget)setEditForm(null);}}>
        <div className="qmf-modal" onMouseDown={e=>e.stopPropagation()}>
          <div className="qmf-modal-head"><strong>회원 정보 수정</strong><button type="button" className="qmf-close" onClick={()=>setEditForm(null)} aria-label="닫기">×</button></div>
          <div className="qmf-modal-body">
            <div className="qmf-modal-grid">
              {field("이름 · 로그인 ID",<input className={inputClass} value={editForm.name} onChange={e=>setEditForm({...editForm,name:e.target.value})}/>)}
              {field("부서",<select className={inputClass} value={editForm.dept} onChange={e=>setEditForm({...editForm,dept:e.target.value})}>{DEPARTMENTS.map(d=><option key={d}>{d}</option>)}</select>)}
              {field("직급",<input className={inputClass} value={editForm.position} onChange={e=>setEditForm({...editForm,position:e.target.value})}/>)}
              {field("연락처",<input className={inputClass} type="tel" value={editForm.phone} onChange={e=>setEditForm({...editForm,phone:e.target.value})}/>)}
              {field("이메일",<input className={inputClass} type="email" value={editForm.email} onChange={e=>setEditForm({...editForm,email:e.target.value})}/>)}
              {field("권한",<div className="qmf-role">{editForm.role==="admin"?"관리자":"일반"}</div>)}
            </div>
            <div className="qmf-modal-actions"><button type="button" className="qmf-btn cancel" onClick={()=>setEditForm(null)}>취소</button><button type="button" className="qmf-btn primary" onClick={saveEdit}>수정 저장</button></div>
          </div>
        </div>
      </div>}
    </div>;
  };
})();
