// Node 环境跑 peerjs 浏览器包需要的全局 shim
global.location = { protocol: 'http:', href: 'http://localhost:3000/', host: 'localhost:3000' };
global.navigator = { userAgent: 'node', platform: 'node' };
global.WebSocket = require('ws');
global.window = global;
// 最小 shim：只为让 peerjs 过「浏览器兼容」检查、并验证信令握手能拿到 ID（Node 无真实 WebRTC，协商会失败属正常）
global.RTCPeerConnection = function () {};
global.webkitRTCPeerConnection = global.RTCPeerConnection;
global.RTCPeerConnection.prototype = {};

const { spawn } = require('child_process');
const { Peer } = require('peerjs');
const node = process.execPath;
const srv = spawn(node, ['server.js'], { cwd: __dirname, stdio: 'ignore' });
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const OPT = { host: 'localhost', port: 3000, path: '/peerjs' };

(async () => {
  await wait(1500);
  const a = new Peer(null, OPT);
  const b = new Peer(null, OPT);
  let aId, bId, connected = false;
  a.on('open', id => { aId = id; console.log('A open', id); });
  a.on('error', e => console.log('A err', e.type, e.message));
  b.on('open', id => { bId = id; console.log('B open', id);
  b.on('error', e => console.log('B err', e.type, e.message));
    const dc = a.connect(bId);
    dc.on('open', () => { connected = true; console.log('P2P DATA CHANNEL OPEN PASS'); });
    dc.on('error', e => console.log('dc err', e.message));
  });
  a.on('connection', () => {});
  await wait(5000);
  console.log('RESULT', connected ? 'PASS' : 'FAIL');
  a.destroy(); b.destroy(); srv.kill(); process.exit(0);
})();
