const BASE='/api';
export const token=()=>localStorage.getItem('auth_token');
function errorMessage(detail:unknown,status:number){
  if(typeof detail==='string')return detail;
  if(Array.isArray(detail))return detail.map(item=>{
    if(!item||typeof item!=='object')return String(item);
    const row=item as {loc?:unknown[];msg?:string};
    const field=row.loc?.filter(x=>x!=='body').join('.')||'request';
    return `${field}: ${row.msg||'Invalid value'}`;
  }).join('\n');
  return `HTTP ${status}`;
}
export async function api(path:string, options:RequestInit={}){
  const headers=new Headers(options.headers); if (!(options.body instanceof FormData)) headers.set('Content-Type','application/json');
  if(token()) headers.set('Authorization',`Bearer ${token()}`);
  const r=await fetch(BASE+path,{...options,headers}); if(!r.ok){let d:any={};try{d=await r.json()}catch{}throw new Error(errorMessage(d.detail,r.status))}
  if(r.status===204)return null; return r.json();
}
export const json=(method:string,body?:unknown):RequestInit=>({method,body:body===undefined?undefined:JSON.stringify(body)});
export function connect(publicId:string,onUpdate:()=>void){let socket:WebSocket,stopped=false,retry=1000;
 const open=()=>{const proto=location.protocol==='https:'?'wss':'ws';socket=new WebSocket(`${proto}://${location.host}/api/ws/${publicId}`);socket.onmessage=onUpdate;socket.onopen=()=>retry=1000;socket.onclose=()=>{if(!stopped)setTimeout(open,retry=Math.min(retry*2,10000))}};open();return()=>{stopped=true;socket?.close()}}
