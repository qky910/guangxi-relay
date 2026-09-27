const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const node = process.execPath;
const srv = spawn(node, ['server.js'], { cwd: __dirname, stdio: 'ignore' });
const get = (path) => new Promise((res) => {
  http.get('http://localhost:3000' + path, (r) => { let d = ''; r.on('data', c => d += c); r.on('end', () => res({ status: r.statusCode, body: d })); }).on('error', e => res({ err: e.message }));
});
const wait = (ms) => new Promise(r => setTimeout(r, ms));

function client(code) {
  return new Promise((resolve) => {
    const ws = new WebSocket('ws://localhost:3000/relay');
    const got = [];
    ws.on('open', () => ws.send(JSON.stringify({ type: 'hello', code })));
    ws.on('message', (m) => { got.push(JSON.parse(m)); });
    ws.on('error', e => console.log('ws err', code, e.message));
    setTimeout(() => resolve({ ws, got }), 600);
  });
}
const send = (ws, o) => ws.send(JSON.stringify(o));

(async () => {
  await wait(1500);
  const ps = await get('/peerjs/peerjs');        // PeerServer 挂载检查
  console.log('PEERJS mount:', ps.status, ps.body.slice(0, 40));
  const A = await client('AAA');
  const B = await client('BBB');
  await wait(400);
  console.log('A welcome:', JSON.stringify(A.got.find(x => x.type === 'welcome')));
  console.log('B welcome:', JSON.stringify(B.got.find(x => x.type === 'welcome')));
  // A 邀请 B
  send(A.ws, { type: 'invite', to: 'BBB', from: 'AAA', name: '阿琬', peerId: 'peer-id-xyz' });
  await wait(400);
  const inv = B.got.find(x => x.type === 'invite');
  console.log('B received invite:', JSON.stringify(inv));
  // 邀请一个不在线的
  send(A.ws, { type: 'invite', to: 'ZZZ', from: 'AAA', peerId: 'p2' });
  await wait(300);
  console.log('A invite-failed:', JSON.stringify(A.got.find(x => x.type === 'invite-failed')));
  A.ws.close(); B.ws.close(); srv.kill(); process.exit(0);
})();
