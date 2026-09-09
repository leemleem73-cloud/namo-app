'use strict';
process.env.DATABASE_URL=process.env.DATABASE_URL||'postgres://postgres:postgres@127.0.0.1:5432/namo_test';
process.env.SESSION_SECRET='ci-session-secret';
const express=require('express');
const {installNamoTalkStandaloneRoutes}=require('../namo-talk-standalone-server');
const app=express();app.use(express.json());installNamoTalkStandaloneRoutes(app);
const port=46770;const server=app.listen(port,'127.0.0.1');
const base='http://127.0.0.1:'+port+'/api/namo-talk-standalone';
async function req(path,opt={}){const r=await fetch(base+path,opt);let j={};try{j=await r.json()}catch(_){}return {r,j};}
(async()=>{try{
 let x=await req('/health');if(!x.r.ok||!x.j.success)throw Error('health');
 x=await req('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'박현아',password:'1234'})});
 if(!x.r.ok||!x.j.token)throw Error('login');const token=x.j.token;
 const auth={'Content-Type':'application/json',Authorization:'Bearer '+token};
 x=await req('/signup',{method:'POST',headers:auth,body:JSON.stringify({name:'테스트직원',department:'테스트부',password:'1234'})});
 if(!x.r.ok && x.r.status!==409)throw Error('signup');
 x=await req('/users',{headers:{Authorization:'Bearer '+token}});if(!x.r.ok||!x.j.users.some(u=>u.name==='테스트직원'))throw Error('users');
 x=await req('/messages',{method:'POST',headers:auth,body:JSON.stringify({peer:'테스트직원',text:'독립 API 테스트'})});if(!x.r.ok||!x.j.message?.id)throw Error('send');const messageId=x.j.message.id;
 x=await req('/messages/'+messageId,{method:'PUT',headers:auth,body:JSON.stringify({action:'edit',text:'수정 테스트'})});if(!x.r.ok)throw Error('edit');
 x=await req('/messages/'+messageId,{method:'PUT',headers:auth,body:JSON.stringify({action:'pin',peer:'테스트직원'})});if(!x.r.ok)throw Error('pin');
 x=await req('/messages?peer='+encodeURIComponent('테스트직원'),{headers:{Authorization:'Bearer '+token}});if(!x.r.ok||!x.j.messages.some(m=>String(m.id)===String(messageId)&&m.text==='수정 테스트'&&m.pinned===true))throw Error('verify edit/pin');
 x=await req('/messages/'+messageId,{method:'PUT',headers:auth,body:JSON.stringify({action:'delete'})});if(!x.r.ok)throw Error('delete');
 x=await req('/messages?peer='+encodeURIComponent('테스트직원'),{headers:{Authorization:'Bearer '+token}});if(!x.r.ok||x.j.messages.some(m=>String(m.id)===String(messageId)))throw Error('verify delete');
 console.log('PASS standalone API health/login/users/messages/edit/pin/delete');server.close(()=>process.exit(0));
}catch(e){console.error(e);server.close(()=>process.exit(1));}})();