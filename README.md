# FitSnake — 燃脂贪吃蛇

（MVP / React + Vite）

> 用摄像头 + 姿态识别玩贪吃蛇：举左/右手、抬左/右腿 → 控制上下左右。一边玩一边燃脂。

* **Demo**：`soon`（部署到 GitHub Pages / Vercel 即可）
* **技术栈**：React + Vite + Canvas 2D + **TensorFlow\.js MoveNet SinglePose Lightning**（本地推理，无需后端）

---

## 功能亮点（MVP）

* 摄像头取景 + 网格/蓝框“有效动作区”叠加（参考图1）
* 识别 4 动作并映射方向：举左手=左、举右手=右、抬左腿=下、抬右腿=上
* 经典贪吃蛇：吃到食物加分变长；撞墙/撞自己即结束
* 右上角大号 `Score`；结束弹出「再来一局」胶囊按钮（参考图2风格）
* 全程本地计算，不上传视频，隐私友好

---

## 快速开始

### 1) 环境

* Node.js ≥ 18
* 推荐：pnpm（也可用 npm / yarn）

### 2) 安装 & 运行

```bash
pnpm install
pnpm dev
```

打开终端提示的本地地址（通常 [http://localhost:5173）。](http://localhost:5173）。)

### 3) 生产构建

```bash
pnpm build
pnpm preview
```

---

## 姿态识别（MoveNet / TF.js）

### 安装依赖

```bash
pnpm add @tensorflow/tfjs-core @tensorflow/tfjs-converter @tensorflow/tfjs-backend-webgl @tensorflow-models/pose-detection
```

### 最小可用初始化（放在你的组件里）

```ts
// src/pose/detector.ts
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as posedetection from '@tensorflow-models/pose-detection';

export type Direction = 'up' | 'down' | 'left' | 'right' | null;

export async function createMoveNetDetector() {
  await tf.setBackend('webgl');
  await tf.ready();

  const detector = await posedetection.createDetector(
    posedetection.SupportedModels.MoveNet,
    {
      modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true,
    }
  );
  return detector;
}

const KP = (pose: posedetection.Pose) => {
  const map: Record<string, posedetection.Keypoint> = {};
  pose.keypoints.forEach(k => { if (k.name) map[k.name] = k; });
  return map;
};

export function mapPoseToDirection(
  pose: posedetection.Pose,
  minScore = 0.4,
  holdMs = 220
) {
  // 方向防抖（闭包外可保存最近一次触发时间戳）
  let lastDir: Direction = null;
  let lastTs = 0;

  return (now: number): Direction => {
    const k = KP(pose);
    const s = (n: string) => (k[n]?.score ?? 0) >= minScore;

    // y 越小表示位置越高（相机坐标）
    const upRight = s('right_wrist') && s('right_shoulder') &&
                    k['right_wrist'].y < k['right_shoulder'].y;
    const upLeft  = s('left_wrist') && s('left_shoulder') &&
                    k['left_wrist'].y  < k['left_shoulder'].y;
    const kneeUpR = s('right_knee') && s('right_hip') &&
                    k['right_knee'].y  < k['right_hip'].y;
    const kneeUpL = s('left_knee') && s('left_hip') &&
                    k['left_knee'].y   < k['left_hip'].y;

    let dir: Direction = null;
    if (upRight) dir = 'right';
    else if (upLeft) dir = 'left';
    else if (kneeUpR) dir = 'up';
    else if (kneeUpL) dir = 'down';

    if (!dir) return null;

    if (dir !== lastDir) {
      lastDir = dir;
      lastTs = now;
      return null; // 开始计时，等待稳定
    }
    if (now - lastTs >= holdMs) {
      return dir; // 稳定超过阈值，触发方向
    }
    return null;
  };
}

export async function startEstimateLoop(
  videoEl: HTMLVideoElement,
  detector: posedetection.PoseDetector,
  onDirection: (d: Direction) => void,
  targetFps = 20
) {
  const interval = 1000 / targetFps;
  let last = 0;

  const tick = async (now: number) => {
    if (now - last >= interval) {
      last = now;
      const poses = await detector.estimatePoses(videoEl, {
        maxPoses: 1,
        flipHorizontal: true, // 镜像更符合用户直觉
      });
      if (poses[0]) {
        // 为当前帧创建一个映射函数（闭包保存lastDir/lastTs）
        const mapper = mapPoseToDirection(poses[0]);
        const dir = mapper(now);
        if (dir) onDirection(dir);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

> 用法：在 React 组件中拿到 `video` 引用后 `createMoveNetDetector()` → `startEstimateLoop(video, detector, onDirection)`，在 `onDirection` 回调里更新贪吃蛇方向即可。

### 性能建议

* 后端：`webgl`（低端机可尝试 `wasm` 后端）
* 视频分辨率：640×480 或更低，保证 20–30 FPS
* 识别帧率：15–24 FPS（上面用节流控制）
* 光照：尽量均匀、正面光

---

## 游戏渲染（Canvas 2D）

* 网格与蓝色“动作区”边框绘制在 Canvas 上层
* 蛇身：等分网格方块；食物：亮绿色方块
* 循环：方向 → 下一格 → 吃到食物则加长&随机新食物 → 碰撞检测（墙/自身）
* UI：右上角 `Score`；失败后中央弹出胶囊按钮「再来一局」

---

## UI / UX 约定

* **风格**：相机网格科技感（图1）+ 圆润胶囊按钮童趣（图2）
* **配色**

  * 主按钮：向日黄 `#F7C948`
  * 高亮/边框：高饱和蓝 `#2E6FF2`
  * 食物：亮绿 `#27D845`
  * Score：白字 + 轻阴影
* **交互**

  * 进入站位区→点击「开始」→举手/抬腿控制→失败弹窗

---

## 项目结构（建议）

```
fit-snake/
├─ index.html
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ game/
│  │  ├─ engine.ts        # 蛇逻辑（位置/移动/碰撞/食物）
│  │  └─ renderer.ts      # Canvas 绘制（蛇/食物/网格/Score）
│  ├─ pose/
│  │  └─ detector.ts      # 上面的 MoveNet 初始化与识别循环
│  ├─ components/
│  │  ├─ CameraLayer.tsx  # 摄像头视频
│  │  ├─ CanvasLayer.tsx  # 游戏/网格绘制
│  │  └─ CapsuleButton.tsx
│  ├─ styles/
│  │  └─ theme.css
│  └─ utils/
│     └─ grid.ts
├─ vite.config.ts
├─ package.json
└─ README.md
```

---

## 使用流程（面向评委）

1. 打开页面并授权摄像头
2. 站到蓝色边框范围内
3. 点击「开始」
4. 举手/抬腿控制方向，吃掉绿色方块得分
5. 撞到自己或边界 → 显示「再来一局」按钮

---

## 性能与兼容性

* 推荐 **Chrome / Edge（桌面端）**，开启硬件加速
* 若帧率不稳：降低视频分辨率、减少网格绘制、降低识别帧率
* 光线不足会影响识别，尽量补光

---

## 隐私

* 视频只在本地浏览器处理，不上传
* 无登录、无数据存储

---

## 路线图（Beyond MVP）

* 关卡/连击/成就贴纸
* 60 秒燃脂挑战 & 卡路里估算（娱乐用）
* 双人分屏 PK（同屏区域限定 / WebRTC 房间）
* 手机端适配与触控混合控制
* 排行榜与分享
