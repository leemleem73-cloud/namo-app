#!/usr/bin/env python3
"""Build the QMES WORK ORDER guide video only. No production APIs or data changes."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math, subprocess, os
W,H,FPS,SEC=1280,720,8,5
out=Path("public/videos/qmes-workorder-guide-20261120.mp4")
out.parent.mkdir(parents=True,exist_ok=True)
fontpaths=[
"/usr/share/fonts/truetype/nanum/NanumSquareR.ttf",
"/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
"/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"]
path=next((p for p in fontpaths if Path(p).exists()),None)
if not path: raise RuntimeError("Install Korean font: fonts-nanum")
def f(n,b=False):
 p="/usr/share/fonts/truetype/nanum/NanumSquareB.ttf"
 return ImageFont.truetype(p if b and Path(p).exists() else path,n)
def text(d,x,y,v,n=15,c="#243b52",b=False):
 d.text((x,y),str(v),font=f(n,b),fill=c)
def rect(d,box,color="#fff",border="#d2dde9",r=5):
 d.rounded_rectangle(box,r,fill=color,outline=border,width=1)
def label(d,box,t,blue=False,focus=False):
 rect(d,box,"#277fcf" if blue else "#ffffff","#277fcf" if blue else "#d3dce6",4)
 bb=d.textbbox((0,0),t,font=f(13,True))
 x=(box[0]+box[2]-(bb[2]-bb[0]))/2
 y=(box[1]+box[3]-(bb[3]-bb[1]))/2-2
 text(d,x,y,t,13,"#ffffff" if blue else "#29415a",True)
 if focus:d.rounded_rectangle((box[0]-3,box[1]-3,box[2]+3,box[3]+3),7,outline="#ec9434",width=4)
def shell(title):
 im=Image.new("RGB",(W,H),"#f0f4f8");d=ImageDraw.Draw(im)
 d.rectangle((0,0,W,64),fill="#215d8b")
 text(d,30,17,"NAMO QMES",27,"#ffffff",True)
 text(d,243,24,"품질 · 생산 · 재고 통합관리",15,"#e2effb")
 rect(d,(20,83,218,578),"#fff")
 text(d,37,106,"업무 메뉴",17,b=True)
 for i,t in enumerate(["종합대시보드","수주납기 관리","구매발주 관리","작업지시서","생산대시보드","수입검사 IQC","공정검사 PQC","출하검사 OQC","LOT 추적"]):
  y=150+i*46
  if t=="작업지시서":rect(d,(31,y-5,208,y+34),"#e6f4ff","#cee5f5")
  text(d,46,y+4,t,15,"#2776c0" if t=="작업지시서" else "#647b8e",t=="작업지시서")
 rect(d,(237,83,1260,578),"#fff")
 text(d,264,102,title,23,b=True)
 d.line((255,143,1242,143),fill="#d8e1ec",width=2)
 return im,d
def foot(d,active=False):
 d.rectangle((248,519,1245,572),fill="#f8fafc")
 label(d,(862,530,961,563),"목록으로")
 label(d,(970,530,1091,563),"저장 후 인쇄")
 label(d,(1102,530,1226,563),"저장",True,active)
def section(d,title,y=182,bottom=495):
 rect(d,(265,y,1235,bottom))
 d.rectangle((266,y+1,1234,y+39),fill="#f1f6fb")
 text(d,282,y+12,title,16,b=True)
def formbase(title):
 im,d=shell("신규 작업지시서 등록")
 text(d,264,157,title,15,"#2775ba",True)
 return im,d
def scene(idx):
 if idx==0:
  im,d=shell("작업지시서 등록 및 조회")
  label(d,(1001,98,1228,138),"+ 신규 작업지시서 등록",True,True)
  section(d,"원료 선입선출 확인",169,294)
  for i,(a,b) in enumerate([("원재료명","원재료명 선택"),("원료 LOT 선택","수입검사 LOT 선택"),("원료 LOT 스캔","원료 LOT 선택")]):
   x=285+i*211;text(d,x,217,a,12,"#697f93",True)
   rect(d,(x,238,x+183,271));text(d,x+8,246,b,12,"#697f93")
  label(d,(967,231,1085,266),"선입선출 확인");label(d,(1093,231,1208,266),"QR 라벨")
  text(d,265,321,"작업지시 현황",16,b=True)
  rect(d,(264,354,1226,480),"#fdfefe")
  headers=["고객사","작업지시번호","제품명","생산 LOT NO","작업자","진행상태"]
  vals=["예시 고객사","WO-예시-001","NBA20HM05","LOT-예시","담당자","대기"]
  widths=[175,180,180,175,133,114]
  d.rectangle((265,355,1225,404),fill="#f0f5fa")
  x=273
  for h,v,w in zip(headers,vals,widths):text(d,x,371,h,12,b=True);text(d,x,427,v,12);x+=w
  return im,(1120,116)
 im,d=formbase(["","작업 기본정보 입력","원료 투입계획","비고 입력","수신부서 선택","이메일 발송","최종 저장 확인"][idx])
 if idx==1:
  section(d,"작업 기본정보",182,506)
  fields=[("작업지시번호","자동생성"),("작업일자","2026-11-20"),("고객사명","예시 고객사"),("제품명","NBA20HM05"),("생산 LOT NO","LOT-예시"),("설비명","HSM"),("작업자","담당자 선택"),("계획수량","160"),("작업 시작일","2026-11-20"),("작업 종료일","2026-11-20"),("진행상태","대기"),("생산구분","양산")]
  for i,(a,b) in enumerate(fields):
   x=282+(i%4)*232;y=235+(i//4)*87
   text(d,x,y,a,12,"#5c7185",True)
   box=(x,y+25,x+212,y+58);rect(d,box,"#f4f7fa" if i==0 else "#fff")
   text(d,x+8,y+33,b,12)
   if i in [1,2,3,6,8,9]:d.rounded_rectangle((x-2,y+22,x+214,y+60),4,outline="#eca045",width=2)
  pt=(827,362)
 elif idx==2:
  section(d,"원료 투입계획",183,495)
  label(d,(1102,189,1216,218),"+ 행 추가")
  headers=["NO","원료명","원료 LOT NO","계획투입량(kg)","실투입량(kg)","투입비율(%)"]
  widths=[55,164,207,181,170,170]
  def tr(y,items,header=False):
   x=280
   for cell,w in zip(items,widths):
    d.rectangle((x,y,x+w,y+41),fill="#edf4fa" if header else "#fff",outline="#d9e2eb")
    text(d,x+9,y+13,cell,11,"#2c445e",header)
    if not header and x==280+sum(widths[:3]):
     d.rounded_rectangle((x+5,y+4,x+w-5,y+36),radius=4,outline="#f19d3e",width=2)
    x+=w
  tr(242,headers,True)
  for j,row in enumerate([["1","NMP","수입검사 LOT 선택","120","-","75.00"],["2","BYK180","수입검사 LOT 선택","8","-","5.00"],["3","AOH30","수입검사 LOT 선택","24","-","15.00"],["4","SBS","수입검사 LOT 선택","8","-","5.00"]]):tr(283+j*41,row)
  text(d,282,469,"※ LOT는 수입검사 기록에서 선택합니다. 실투입량은 생산실적 입력 단계에서 작성합니다.",12,"#647c91")
  pt=(880,350)
 elif idx==3:
  section(d,"비고",183,453)
  box=(284,244,1215,358);rect(d,box)
  text(d,304,265,"작업 시 전달사항 또는 특이사항이 있다면 입력합니다.",16,"#536a7d")
  text(d,304,310,"비고가 없으면 공란으로 둘 수 있습니다.",13,"#7a8d9f")
  d.rounded_rectangle((281,241,1218,361),7,outline="#ee9f3b",width=4)
  pt=(704,315)
 elif idx in (4,5):
  section(d,"발송 대상 및 수신부서",183,495)
  text(d,281,252,"수신부서",15,b=True)
  label(d,(409,241,542,279),"✓ 생산부",focus=idx==4)
  label(d,(552,241,691,279),"✓ 품질부",focus=idx==4)
  text(d,738,253,"복수 선택 가능",13,"#718498")
  d.line((285,294,1218,294),fill="#dce3ec")
  text(d,282,321,"수신 담당자",15,b=True)
  label(d,(409,306,557,346),"✓ 담당자 A",focus=idx==4)
  label(d,(563,306,711,346),"✓ 담당자 B",focus=idx==4)
  d.line((284,371,1218,371),fill="#dce3ec")
  text(d,282,401,"선택 부서 2개 · 수신자 2명",13,"#597187")
  label(d,(1012,390,1218,432),"이메일 발송",True,idx==5)
  if idx==5:text(d,295,452,"이메일 발송 클릭 → 작업지시서 먼저 저장 → 이메일 발송 및 알림",13,"#218352",True)
  pt=(1106,410) if idx==5 else (485,323)
 elif idx==6:
  section(d,"작업지시서 저장 및 최종 확인",183,488)
  text(d,294,256,"작업 기본정보 · 원료 투입계획 · 비고 · 수신 대상 확인",17,b=True)
  text(d,294,307,"이메일 발송 시 작업지시서를 먼저 저장합니다.",16,"#208456",True)
  text(d,294,356,"발송 후 수정한 내용이 있으면 다시 저장 버튼을 눌러 반영합니다.",15)
  text(d,294,409,"교육용 시연: 실제 작업지시 등록이나 이메일 전송은 수행하지 않습니다.",13,"#3976ad")
  pt=(1155,544)
 foot(d,idx==6)
 return im,pt
stages=[
 ("작업지시서 선택","작업지시서 메뉴 → 신규 작업지시서 등록"),
 ("작업 기본정보 입력","작업일자 · 고객사명 · 제품명 · 작업자 · 작업기간"),
 ("원료 투입계획 입력","원료명 · 원료 LOT · 계획투입량(kg)"),
 ("비고 입력","전달사항이나 특이사항이 있는 경우 입력"),
 ("수신부서 선택","수신부서 및 수신 담당자 선택"),
 ("이메일 발송","발송 시 작업지시서 먼저 저장 후 이메일 발송"),
 ("저장 및 확인","최종 내용 확인 및 저장")
]
bases=[scene(i) for i in range(7)]
cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pixel_format","rgb24","-video_size",f"{W}x{H}","-framerate",str(FPS),"-i","pipe:0","-c:v","libx264","-preset","ultrafast","-crf","24","-pix_fmt","yuv420p","-movflags","+faststart","-an",str(out)]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
try:
 for idx,(base,pos) in enumerate(bases):
  for j in range(FPS*SEC):
   im=base.copy();d=ImageDraw.Draw(im)
   x,y=pos;t=j/FPS
   px=x-26*(1-min(t/2.2,1));py=y-18*(1-min(t/2.2,1))
   if 2.2<t<3.5:
    rad=11+int((t-2.2)*23)
    d.ellipse((px-rad,py-rad,px+rad,py+rad),outline="#e99338",width=3)
   d.polygon([(px,py),(px+8,py+23),(px+13,py+12),(px+23,py+16)],fill="#123550")
   d.rectangle((0,593,W,H),fill="#143149")
   d.rectangle((0,593,8,H),fill="#4fbcff")
   title,desc=stages[idx]
   text(d,34,606,f"작업지시서 사용가이드  ·  STEP {idx+1:02d} / 07",15,"#88ceff",True)
   text(d,35,632,title,25,"#fff",True)
   text(d,425,641,desc,16,"#e5f0f8")
   d.rectangle((0,711,W,720),fill="#496077")
   d.rectangle((0,711,int(((idx+j/(FPS*SEC))/7)*W),720),fill="#43b8ff")
   proc.stdin.write(im.tobytes())
 proc.stdin.close()
except Exception:
 proc.kill();raise
err=proc.stderr.read().decode(errors="replace")
if proc.wait():raise RuntimeError("ffmpeg failed "+err)
print(out, out.stat().st_size,"bytes")
