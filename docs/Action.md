# CV 动作识别流程分析

## 1. 技术架构

### 核心技术栈
- **TensorFlow.js**: 浏览器端机器学习框架
- **MoveNet模型**: Google开发的轻量级姿态估计模型
- **WebGL后端**: 硬件加速推理
- **MediaStream API**: 摄像头视频流获取

### 模型配置
```typescript
// 使用SINGLEPOSE_LIGHTNING模型，平衡性能和精度
const detector = await posedetection.createDetector(
  posedetection.SupportedModels.MoveNet,
  {
    modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    enableSmoothing: true, // 启用平滑处理
  }
);
```

## 2. 检测流程

### 2.1 初始化阶段
1. **摄像头权限申请** (`CameraLayer.tsx`)
   - 请求用户媒体权限
   - 获取视频流并绑定到video元素
   - 触发`onVideoReady`回调

2. **姿态检测器初始化** (`App.tsx:handleVideoReady`)
   - 创建MoveNet检测器
   - 设置检测状态为激活
   - 启动估计循环

### 2.2 实时检测循环
```typescript
// detector.ts:startEstimateLoop
const tick = async (now: number) => {
  if (now - last >= interval) { // 20fps限制
    const poses = await detector.estimatePoses(videoEl, {
      maxPoses: 1,
      flipHorizontal: true, // 镜像显示
    });
    if (poses[0]) {
      const mapper = mapPoseToDirection(poses[0]);
      const dir = mapper(now);
      if (dir) onDirection(dir); // 触发方向回调
    }
  }
  requestAnimationFrame(tick);
};
```

### 2.3 姿态映射逻辑
```typescript
// detector.ts:mapPoseToDirection
// 关键点检测逻辑：
- 举右手: right_wrist.y < right_shoulder.y → 'right'
- 举左手: left_wrist.y < left_shoulder.y → 'left' 
- 抬右腿: right_knee.y < right_hip.y → 'up'
- 抬左腿: left_knee.y < left_hip.y → 'down'

// 防抖机制：
- 最小置信度: 0.4
- 稳定时间: 220ms
- 避免误触发和抖动
```

## 3. 关键组件分析

### 3.1 状态管理 (`App.tsx`)
```typescript
interface AppState {
  currentPose: 'left_hand' | 'right_hand' | 'left_leg' | 'right_leg' | 'none';
  isDetectionActive: boolean;
  fitnessStats: {
    leftHandRaises: number;
    rightHandRaises: number;
    leftLegRaises: number;
    rightLegRaises: number;
    totalMoves: number;
    caloriesBurned: number;
  };
}
```

### 3.2 UI显示组件
- **PoseIndicator**: 显示当前姿态状态
- **PoseDirectionVisualizer**: 方向指示器网格
- **StatsPanel**: 健身统计面板

## 4. 当前问题诊断

### 4.1 核心问题
**currentPose状态未更新**: 在`App.tsx:handleVideoReady`的姿态检测回调中，只处理了`direction`到游戏控制的映射，但没有更新`currentPose`状态。

```typescript
// 当前代码 - 缺少currentPose更新
(direction: Direction) => {
  if (state.gameEngine) {
    // ✅ 更新健身统计
    setState(prev => {
      const newStats = { ...prev.fitnessStats };
      switch (direction) {
        case 'left': newStats.leftHandRaises++; break;
        // ...
      }
      return { ...prev, fitnessStats: newStats };
    });
    
    // ❌ 缺少: currentPose状态更新
    // ❌ 缺少: 将direction映射回pose类型
    
    state.gameEngine.setDirection(direction);
  }
}
```

### 4.2 映射关系断层
- **检测层**: `pose keypoints` → `direction` ✅
- **游戏层**: `direction` → `game control` ✅  
- **UI层**: `currentPose` → `visual feedback` ✅
- **断层**: `direction` → `currentPose` ❌

## 5. 修复方案

### 5.1 添加direction到pose的反向映射
```typescript
// 需要添加的映射函数
const directionToPose = (direction: Direction): AppState['currentPose'] => {
  switch (direction) {
    case 'left': return 'left_hand';
    case 'right': return 'right_hand';
    case 'down': return 'left_leg';
    case 'up': return 'right_leg';
    default: return 'none';
  }
};
```

### 5.2 更新状态管理逻辑
在姿态检测回调中添加currentPose状态更新：
```typescript
(direction: Direction) => {
  if (state.gameEngine) {
    setState(prev => ({
      ...prev,
      currentPose: directionToPose(direction), // 🔧 添加这行
      fitnessStats: newStats,
      gameStats: { ...prev.gameStats, movesCount: prev.gameStats.movesCount + 1 }
    }));
  }
}
```

### 5.3 添加状态重置机制
考虑添加定时器来重置currentPose为'none'，避免状态一直保持激活。

## 6. 验证要点

1. **实时反馈**: 做动作时，状态面板应立即高亮对应方向
2. **状态同步**: PoseIndicator和PoseDirectionVisualizer应显示一致
3. **统计准确**: 健身统计数字应正确累加
4. **游戏控制**: 贪吃蛇应响应姿态控制

## 7. 调试建议

- 在姿态检测回调中添加console.log跟踪direction和currentPose
- 检查React DevTools中的状态变化
- 验证防抖机制是否正常工作
- 测试不同光照条件下的检测精度