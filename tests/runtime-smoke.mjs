import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import bcrypt from '/app/node_modules/bcryptjs/index.js';
const password=randomBytes(24).toString('hex');
const env={...process.env,NODE_ENV:'production',PORT:'3000',SECRET_KEY:randomBytes(32).toString('hex'),ADMIN_USERNAME:'runtime-admin',ADMIN_PASSWORD:password,PUBLIC_BASE_URL:'https://example.invalid',ALLOWED_HOSTS:'127.0.0.1,localhost'};
const legacy={users:[{id:1,username:'runtime-admin',full_name:'Test Administrator',password_hash:bcrypt.hashSync(password,10),role:'ADMIN',active:true,must_change_password:false,auth_version:0,theme_color:'#0d9488'}],periods:[],courses:[],groups:[],students:[],sessions:[],criteria:[],presentations:[],tokens:[],votes:[],anonymousVoteScores:[],nextUserId:2,nextPeriodId:1,nextCourseId:1,nextGroupId:1,nextStudentId:1,nextSessionId:1,nextCriterionId:1,nextPresentationId:1,nextTokenId:1,nextVoteId:1};
fs.mkdirSync('/app/data',{recursive:true});fs.writeFileSync('/app/data/db.json',JSON.stringify(legacy));
let child,logs='',token;
async function start(){
 child=spawn(process.execPath,['--import','tsx','server.ts'],{cwd:'/app',env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>{logs+=b;});child.stderr.on('data',b=>{logs+=b;});
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:3000/api/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}
 throw new Error('Startup failed: '+logs);
}
async function stop(){if(child&&child.exitCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}}
async function req(method,path,body,status=200){
 const r=await fetch('http://127.0.0.1:3000'+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal(r.status,status,`${method} ${path}`);return r;
}
try{
 await start();assert.equal((await (await req('GET','/api/health')).json()).version,'3.0.1');
 for(const path of ['/','/dashboard','/poll/1'])assert.match((await req('GET',path)).headers.get('content-type'),/text\/html/);
 await req('GET','/api/unknown-route',undefined,404);
 const persisted=JSON.parse(fs.readFileSync('/app/data/db.json','utf8'));
 assert.equal(persisted.users.length,1);assert.equal(persisted.users[0].password_hash,legacy.users[0].password_hash);assert.equal(persisted.polls.length,0);assert.equal(persisted.periods.length,0);
 const login=await(await req('POST','/api/auth/login',{username:'runtime-admin',password})).json();token=login.access_token;
 const poll=await(await req('POST','/api/polls',{title:'Runtime quiz',course_name:'Course',period_name:'Period',session_date:'2026-11-18',questions:[{text:'Test?',type:'TRUE_FALSE',options:['True','False'],correct_option_index:0}]},201)).json();
 const detail=await(await req('GET',`/api/polls/${poll.id}`)).json();assert.equal(detail.questions.length,1);
 await stop();await start();
 const loaded=await(await req('GET',`/api/polls/${poll.id}`)).json();assert.equal(loaded.questions.length,1);
 const backup=await(await req('GET','/api/admin/backup')).json();assert.equal(backup.polls.length,1);
 assert.equal(backup.users[0].password_hash,legacy.users[0].password_hash);
 console.log('PASS: production Node image startup/deep links, existing database/account preservation, no startup samples, quiz creation and persistence across restart');
}catch(error){console.error(error);console.error(logs);process.exitCode=1;}
finally{await stop();}
