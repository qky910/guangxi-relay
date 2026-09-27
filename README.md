# guangxi-relay —— 联机后端（自托管信令 + 好友中转）

给「广西枪战」「烘焙物语」等 PeerJS 网页游戏用的轻量后端：

- **`/peerjs`**：PeerServer 信令服务，替代不稳定的公共云 `0.peerjs.com`。
- **`/relay`**：WebSocket 中转，维护好友在线状态 + 转发对战邀请（不再需要在 QQ/微信发链接）。

好友关系存在各客户端 `localStorage`（好友码列表），服务端无数据库、无注册。

---

## 一、部署到 Render（免费版）

> 这是联机真正可用的唯一必须步骤。部署好拿到地址后，回填到游戏里即可。

1. 把 `relay-server/` 整个目录推送到你自己的 GitHub 仓库（新建一个仓库，例如 `guangxi-relay`，把里面 6 个文件传上去即可）。
2. 打开 [render.com](https://render.com) → 注册/登录 → **New → Web Service** → 选刚才的 GitHub 仓库。
3. 配置（仓库里的 `render.yaml` 会自动带好，也可手动填）：
   - **Runtime**：Node
   - **Build Command**：`npm install`
   - **Start Command**：`node server.js`
   - **Health Check Path**：`/health`
   - 地区选 **Oregon**（美西，离国内近一点）
   - 实例类型选 **Free**
4. 点 Create，等几分钟部署完成。控制台会显示一个地址，形如：
   `https://guangxi-relay-xxxx.onrender.com`
5. 复制这个地址里的**主机部分**（即 `guangxi-relay-xxxx.onrender.com`，**不要**带 `https://`）。

---

## 二、回填到游戏 `guangxi-sandbox.html`

打开游戏文件，找到这一行（约在「好友系统」注释下方）：

```js
const RELAY_HOST = '';
```

改成你的地址（只填主机名，不要 `https://`）：

```js
const RELAY_HOST = 'guangxi-relay-xxxx.onrender.com';
```

改完把游戏重新上传/部署（例如之前用的 PythonAnywhere 那套流程）。好友码、在线状态、一键邀请就全部生效了。

> 免费版会空闲 15 分钟后休眠，首次访问冷启动约 30~50s，期间中转连接会自动重试，属正常。

---

## 三、本地调试（可选，不需要部署也能测）

1. 本机装好 Node，进入 `relay-server/`：`npm install` 然后 `node server.js`
2. 浏览器直接打开本地游戏 HTML（`file://.../guangxi-sandbox.html` 或 `http://localhost:端口/...`）
3. 把游戏里的 `RELAY_HOST` 改成：
   ```js
   const RELAY_HOST = 'localhost';
   ```
   代码会自动改用 `ws://localhost:3000/relay` 和非加密端口，本地即可联调。
4. 开两个浏览器标签页（或两台设备都指 `localhost`），互加好友码即可看到在线点并一键邀请。

---

## 四、部署后自检

- 浏览器开游戏 → 点「邀请对决」→ 应显示「我的好友码 XXXX」与好友列表。
- 把码发给好友，好友在「添加好友」输入你的码 → 双方都开着面板时，你的列表里对方出现**绿点**。
- 点对方的「邀请」→ 对方游戏弹出「XX 邀请你进行对决」→ 接受即进入对战。
- 若一直灰点/邀请失败：先确认 `RELAY_HOST` 已填且后端已部署上线（`https://你的地址/health` 应返回 `guangxi-relay ok`）。

---

## 本地运行（纯后端，不涉及游戏）

```
npm install
node server.js
# 健康检查：curl http://localhost:3000/health
```
