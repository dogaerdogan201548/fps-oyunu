const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const PUB=path.join(__dirname,'public');
const MIME={'.html':'text/html','.js':'text/javascript','.glb':'model/gltf-binary','.png':'image/png'};
const srv=http.createServer((q,r)=>{
  const p=path.normalize(path.join(PUB,q.url==='/'?'index.html':q.url.split('?')[0]));
  if(!p.startsWith(PUB)){r.writeHead(403);return r.end();}
  fs.readFile(p,(e,d)=>{
    if(e){r.writeHead(404);return r.end('yok');}
    r.writeHead(200,{'Content-Type':MIME[path.extname(p)]||'application/octet-stream'});r.end(d);
  });
});
const wss=new WebSocketServer({server:srv});
const players=new Map();let nid=1;
const send=(ws,o)=>ws.readyState===1&&ws.send(JSON.stringify(o));
const all=o=>wss.clients.forEach(c=>send(c,o));
wss.on('connection',ws=>{
  const id=nid++;
  const pl={id,x:Math.random()*40-20,y:1.6,z:Math.random()*40-20,ry:0,hp:100,kills:0};
  players.set(id,pl);
  send(ws,{t:'hello',id,x:pl.x,z:pl.z});
  ws.on('message',m=>{
    let d;try{d=JSON.parse(m)}catch{return}
    if(d.t==='s'){pl.x=+d.x;pl.y=+d.y;pl.z=+d.z;pl.ry=+d.ry;}
    if(d.t==='hit'){
      const v=players.get(d.id);
      if(v&&v!==pl){
        v.hp-=25;
        if(v.hp<=0){
          v.hp=100;v.x=Math.random()*40-20;v.z=Math.random()*40-20;pl.kills++;
          all({t:'kill',by:id,id:v.id,x:v.x,z:v.z});
        }
      }
    }
  });
  ws.on('close',()=>players.delete(id));
});
setInterval(()=>all({t:'state',players:[...players.values()]}),50);
const PORT=process.env.PORT||3000;
srv.listen(PORT,()=>{
  console.log('Bilgisayardan: http://localhost:'+PORT);
  for(const l of Object.values(require('os').networkInterfaces()))
    for(const i of l) if(i.family==='IPv4'&&!i.internal) console.log('Telefondan (ayni Wi-Fi): http://'+i.address+':'+PORT);
});
