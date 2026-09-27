// 广西枪战 / 烘焙物语 —— 联机后端
// 1) PeerServer(路径 /peerjs)：自托管 WebRTC 信令，替代不稳定的公共云 0.peerjs.com
// 2) WebSocket 中转(路径 /relay)：好友在线状态 + 邀请推送（无需在 QQ/微信发链接）
//
// 设计：好友关系存在各客户端 localStorage（好友码列表），服务端只维护「在线表」与转发邀请，
// 因此无需数据库、无需注册。好友码由客户端生成，加好友只需交换一次码，之后一键邀请。
const http = require('http');
const { PeerServer } = require('peer');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') { res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('guangxi-relay ok'); return; }
  res.writeHead(404); res.end();
});

// 自托管 PeerJS 信令（游戏里的 new Peer 指向这里）
const peerServer = PeerServer({ server, path: '/peerjs' });

// 好友中转：在线表(code->ws) + 邀请转发
const wss = new WebSocketServer({ server, path: '/relay' });
const online = new Map();

function send(ws, obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }

wss.on('connection', ws => {
  let code = null;
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (_) { return; }
    if (m.type === 'hello') {
      code = String(m.code || '').slice(0, 16);
      if (!code) { send(ws, { type: 'error', msg: 'empty code' }); return; }
      online.set(code, ws);
      console.log('[relay] hello', code, 'online', online.size);
      send(ws, { type: 'welcome', code });
    } else if (m.type === 'query') {
      send(ws, { type: 'presence', code: m.code, online: online.has(m.code) });
    } else if (m.type === 'invite') {
      const t = online.get(m.to);
      if (t) { send(t, { type: 'invite', from: m.from, name: m.name || '', peerId: m.peerId }); send(ws, { type: 'invite-sent', to: m.to }); }
      else { send(ws, { type: 'invite-failed', to: m.to, reason: '对方不在线' }); }
    } else if (m.type === 'bye') {
      if (code) online.delete(code);
    }
  });
  ws.on('close', () => { if (code) { online.delete(code); console.log('[relay] bye', code, 'online', online.size); } });
  ws.on('error', () => {});
});

server.listen(PORT, () => console.log('guangxi-relay listening on', PORT, '| peerjs path /peerjs | relay path /relay'));
