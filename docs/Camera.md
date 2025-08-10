# 摄像头工作逻辑整体设计和实现

## 📋 概述

本文档详细梳理 FitSnake 项目中摄像头相关功能的整体架构、实现逻辑和调试方向。摄像头功能主要包括视频流获取、实时渲染、姿态检测和动作识别四个核心模块。

## 🏗️ 整体架构

```
摄像头功能架构
├── CameraLayer.tsx          # 摄像头视频组件
│   ├── 权限申请
│   ├── 视频流获取
│   ├── 错误处理
│   └── UI状态管理
├── App.tsx                  # 主应用集成
│   ├── handleVideoReady     # 视频就绪回调
│   ├── 姿态检测器初始化
│   └── 动作识别集成
└── pose/detector.ts         # 姿态检测引擎
    ├── MoveNet模型加载
    ├── 动作映射逻辑
    └── 实时检测循环
```

## 🎥 1. 摄像头初始化流程

### 1.1 CameraLayer 组件实现

**文件位置**: `src/components/CameraLayer.tsx`

**核心功能**:
- 摄像头权限申请
- MediaStream 获取和管理
- 视频元素绑定
- 错误状态处理

**初始化流程**:
```typescript
// 1. 组件挂载时自动初始化
useEffect(() => {
  const initCamera = async () => {
    // 2. 请求摄像头权限
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user' // 前置摄像头
      },
      audio: false
    });
    
    // 3. 绑定视频流到video元素
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play();
        onVideoReady?.(videoRef.current); // 通知父组件
      };
    }
  };
}, []);
```

**状态管理**:
- `isLoading`: 摄像头加载状态
- `error`: 错误信息
- `hasPermission`: 权限获取状态

### 1.2 视频配置参数

```typescript
const videoConfig = {
  width: { ideal: 640 },    // 理想宽度
  height: { ideal: 480 },   // 理想高度
  facingMode: 'user'        // 前置摄像头
};
```

## 🖼️ 2. 视频流获取和渲染

### 2.1 视频元素渲染

```jsx
<video
  ref={videoRef}
  className="w-full h-full object-cover transform scale-x-[-1]" // 镜像效果
  playsInline
  muted
/>
```

**关键特性**:
- `transform scale-x-[-1]`: 水平镜像，符合用户直觉
- `playsInline`: 移动端内联播放
- `muted`: 静音播放
- `object-cover`: 保持宽高比填充

### 2.2 UI 状态显示

**加载状态**:
```jsx
{isLoading && (
  <div className="flex items-center justify-center bg-gray-900 text-white">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    <p>正在启动摄像头...</p>
  </div>
)}
```

**错误状态**:
```jsx
{error && (
  <div className="text-center p-8">
    <h3>摄像头访问失败</h3>
    <p>{error}</p>
    <button onClick={requestPermission}>重新尝试</button>
  </div>
)}
```

## 🤖 3. 姿态检测集成

### 3.1 App.tsx 中的集成逻辑

**文件位置**: `src/App.tsx`

**handleVideoReady 函数**:
```typescript
const handleVideoReady = useCallback(async (video: HTMLVideoElement) => {
  try {
    // 1. 创建姿态检测器
    const detector = await createMoveNetDetector();
    
    // 2. 更新状态
    setState(prev => ({ 
      ...prev, 
      poseDetector: detector, 
      isDetectionActive: true 
    }));
    
    // 3. 启动检测循环
    await startEstimateLoop(
      video,
      detector,
      (direction: Direction) => {
        // 处理检测到的动作
        if (state.gameEngine) {
          // 更新健身统计
          // 设置游戏方向
          state.gameEngine.setDirection(direction);
        }
      }
    );
  } catch (error) {
    console.error('姿态检测初始化失败:', error);
  }
}, [state.gameEngine]);
```

### 3.2 MoveNet 检测器初始化

**文件位置**: `src/pose/detector.ts`

```typescript
export async function createMoveNetDetector() {
  // 1. 设置 TensorFlow.js 后端
  await tf.setBackend('webgl');
  await tf.ready();

  // 2. 创建 MoveNet 检测器
  const detector = await posedetection.createDetector(
    posedetection.SupportedModels.MoveNet,
    {
      modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      enableSmoothing: true, // 启用平滑处理
    }
  );
  return detector;
}
```

## 🎯 4. 动作识别逻辑

### 4.1 关键点映射

```typescript
const KP = (pose: posedetection.Pose) => {
  const map: Record<string, posedetection.Keypoint> = {};
  pose.keypoints.forEach(k => { if (k.name) map[k.name] = k; });
  return map;
};
```

### 4.2 动作检测规则

```typescript
export function mapPoseToDirection(pose: posedetection.Pose, minScore = 0.4, holdMs = 220) {
  return (now: number): Direction => {
    const k = KP(pose);
    const s = (n: string) => (k[n]?.score ?? 0) >= minScore;

    // 动作检测逻辑
    const upRight = s('right_wrist') && s('right_shoulder') &&
                    k['right_wrist'].y < k['right_shoulder'].y;  // 右手举起
    const upLeft  = s('left_wrist') && s('left_shoulder') &&
                    k['left_wrist'].y < k['left_shoulder'].y;   // 左手举起
    const kneeUpR = s('right_knee') && s('right_hip') &&
                    k['right_knee'].y < k['right_hip'].y;      // 右腿抬起
    const kneeUpL = s('left_knee') && s('left_hip') &&
                    k['left_knee'].y < k['left_hip'].y;       // 左腿抬起

    // 方向映射
    let dir: Direction = null;
    if (upRight) dir = 'right';      // 举右手 = 向右
    else if (upLeft) dir = 'left';   // 举左手 = 向左
    else if (kneeUpR) dir = 'up';    // 抬右腿 = 向上
    else if (kneeUpL) dir = 'down';  // 抬左腿 = 向下

    // 防抖处理
    if (!dir) return null;
    if (dir !== lastDir) {
      lastDir = dir;
      lastTs = now;
      return null; // 开始计时
    }
    if (now - lastTs >= holdMs) {
      return dir; // 稳定超过阈值，触发
    }
    return null;
  };
}
```

### 4.3 实时检测循环

```typescript
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
      // 姿态估计
      const poses = await detector.estimatePoses(videoEl, {
        maxPoses: 1,
        flipHorizontal: true, // 镜像处理
      });
      
      if (poses[0]) {
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

## ⚠️ 5. 错误处理机制

### 5.1 摄像头权限错误

```typescript
try {
  stream = await navigator.mediaDevices.getUserMedia(videoConfig);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : '摄像头访问失败';
  setError(errorMessage);
  onError?.(errorMessage);
}
```

**常见错误类型**:
- `NotAllowedError`: 用户拒绝权限
- `NotFoundError`: 未找到摄像头设备
- `NotReadableError`: 摄像头被其他应用占用
- `OverconstrainedError`: 不支持请求的配置

### 5.2 姿态检测错误

```typescript
try {
  const detector = await createMoveNetDetector();
  // ...
} catch (error) {
  console.error('姿态检测初始化失败:', error);
}
```

### 5.3 资源清理

```typescript
useEffect(() => {
  // ...
  return () => {
    // 清理媒体流
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
}, []);
```

## 🔧 6. 当前存在的问题和调试方向

### 6.1 已知问题

1. **摄像头画面渲染问题**
   - 症状：摄像头权限获取成功，但画面不显示
   - 可能原因：video元素绑定、CSS样式、浏览器兼容性

2. **姿态检测不响应**
   - 症状：摄像头正常，但动作识别无反应
   - 可能原因：TensorFlow.js加载、模型初始化、检测循环

3. **动作识别精度问题**
   - 症状：误识别或识别延迟
   - 可能原因：阈值设置、防抖参数、光线条件

### 6.2 调试步骤

#### 步骤1：验证摄像头基础功能

```javascript
// 在浏览器控制台测试
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('摄像头获取成功:', stream);
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    document.body.appendChild(video);
  })
  .catch(err => console.error('摄像头错误:', err));
```

#### 步骤2：检查video元素状态

```javascript
// 检查video元素属性
const video = document.querySelector('video');
console.log('Video ready state:', video.readyState);
console.log('Video dimensions:', video.videoWidth, video.videoHeight);
console.log('Video playing:', !video.paused);
```

#### 步骤3：验证TensorFlow.js加载

```javascript
// 检查TensorFlow.js状态
console.log('TF backend:', tf.getBackend());
console.log('TF ready:', await tf.ready());
```

#### 步骤4：测试姿态检测

```javascript
// 手动触发一次检测
const poses = await detector.estimatePoses(video);
console.log('检测结果:', poses);
```

### 6.3 优化建议

1. **性能优化**
   - 降低检测帧率（15-20 FPS）
   - 使用较小的视频分辨率
   - 启用模型平滑处理

2. **用户体验优化**
   - 添加更详细的错误提示
   - 提供摄像头测试功能
   - 增加动作识别可视化反馈

3. **兼容性改进**
   - 检测浏览器支持情况
   - 提供降级方案
   - 添加移动端适配

## 📊 7. 调试工具和监控

### 7.1 状态监控

在App.tsx中已实现的状态指示器：
```jsx
<div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
  state.isDetectionActive 
    ? 'bg-green-600 text-white' 
    : 'bg-gray-600 text-gray-300'
}`}>
  <div className={`w-2 h-2 rounded-full mr-2 ${
    state.isDetectionActive ? 'bg-green-300 animate-pulse' : 'bg-gray-400'
  }`}></div>
  {state.isDetectionActive ? '检测中' : '未激活'}
</div>
```

### 7.2 调试日志

建议在关键位置添加调试日志：
```typescript
// CameraLayer.tsx
console.log('摄像头初始化开始');
console.log('视频流获取成功:', stream);
console.log('视频元素就绪:', video);

// App.tsx
console.log('姿态检测器创建成功:', detector);
console.log('检测到动作:', direction);

// detector.ts
console.log('姿态检测结果:', poses);
console.log('关键点数据:', keypoints);
```

## 🎯 下一步行动计划

1. **立即执行**：验证摄像头画面渲染
2. **短期目标**：修复姿态检测初始化
3. **中期目标**：优化动作识别精度
4. **长期目标**：完善错误处理和用户体验

通过系统性的调试和优化，确保摄像头功能稳定可靠地为FitSnake游戏提供动作控制支持。