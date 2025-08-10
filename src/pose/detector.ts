import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as posedetection from '@tensorflow-models/pose-detection';

export type Direction = 'up' | 'down' | 'left' | 'right' | null;

// 关键点绘制工具函数
export function drawKeypoints(
  ctx: CanvasRenderingContext2D,
  pose: posedetection.Pose,
  minScore = 0.3
) {
  const keypoints = pose.keypoints;
  
  // 清除画布
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  
  // 绘制关键点
  keypoints.forEach((keypoint) => {
    if (keypoint.score && keypoint.score >= minScore) {
      const { x, y } = keypoint;
      
      // 绘制关键点圆圈
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#00ff00';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 绘制关键点名称
      if (keypoint.name) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.fillText(keypoint.name, x + 8, y - 8);
      }
    }
  });
  
  // 绘制骨架连接线
  const connections = [
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle']
  ];
  
  const keypointMap: Record<string, posedetection.Keypoint> = {};
  keypoints.forEach(kp => {
    if (kp.name) keypointMap[kp.name] = kp;
  });
  
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  
  connections.forEach(([from, to]) => {
    const fromKp = keypointMap[from];
    const toKp = keypointMap[to];
    
    if (fromKp && toKp && 
        fromKp.score && fromKp.score >= minScore &&
        toKp.score && toKp.score >= minScore) {
      ctx.beginPath();
      ctx.moveTo(fromKp.x, fromKp.y);
      ctx.lineTo(toKp.x, toKp.y);
      ctx.stroke();
    }
  });
}

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

// 全局防抖状态 - 修复防抖机制失效问题
let globalLastDir: Direction = null;
let globalLastTs = 0;
let debugFrameCount = 0;

export function mapPoseToDirection(
  pose: posedetection.Pose,
  minScore = 0.4,
  holdMs = 220
) {
  return (now: number): Direction => {
    const k = KP(pose);
    const s = (n: string) => (k[n]?.score ?? 0) >= minScore;
    
    debugFrameCount++;

    // 减少日志噪音：每30帧打印一次关键点信息
    if (debugFrameCount % 30 === 0) {
      console.log('🎯 [PoseDetector] 关键点检测 (每30帧):', {
        right_wrist: k['right_wrist'] ? { y: k['right_wrist'].y.toFixed(0), score: k['right_wrist'].score?.toFixed(2) } : 'N/A',
        right_shoulder: k['right_shoulder'] ? { y: k['right_shoulder'].y.toFixed(0), score: k['right_shoulder'].score?.toFixed(2) } : 'N/A',
        left_wrist: k['left_wrist'] ? { y: k['left_wrist'].y.toFixed(0), score: k['left_wrist'].score?.toFixed(2) } : 'N/A',
        left_shoulder: k['left_shoulder'] ? { y: k['left_shoulder'].y.toFixed(0), score: k['left_shoulder'].score?.toFixed(2) } : 'N/A'
      });
    }

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

    if (!dir) {
      // 重置防抖状态
      if (globalLastDir !== null) {
        globalLastDir = null;
        globalLastTs = 0;
        console.log('🔄 [PoseDetector] 重置防抖状态');
      }
      return null;
    }

    // 防抖逻辑：使用全局状态
    if (dir !== globalLastDir) {
      globalLastDir = dir;
      globalLastTs = now;
      console.log('⏱️ [PoseDetector] 方向变化，开始计时:', { dir, holdMs });
      return null; // 开始计时，等待稳定
    }
    
    if (now - globalLastTs >= holdMs) {
      console.log('✅ [PoseDetector] 方向稳定，触发:', { dir, holdTime: now - globalLastTs });
      return dir; // 稳定超过阈值，触发方向
    }
    
    // 减少等待日志：每10帧打印一次
    if (debugFrameCount % 10 === 0) {
      console.log('⏳ [PoseDetector] 等待稳定:', { dir, elapsed: now - globalLastTs, needed: holdMs });
    }
    return null;
  };
}

export async function startEstimateLoop(
  videoEl: HTMLVideoElement,
  detector: posedetection.PoseDetector,
  onDirection: (d: Direction) => void,
  onPoseDetected?: (pose: posedetection.Pose) => void,
  targetFps = 20
) {
  const interval = 1000 / targetFps;
  let last = 0;
  let frameCount = 0;
  let lastDirectionTime = 0;

  console.log('🚀 [PoseDetector] 开始姿态检测循环, targetFps:', targetFps);

  const tick = async (now: number) => {
    if (now - last >= interval) {
      last = now;
      frameCount++;
      
      try {
        const poses = await detector.estimatePoses(videoEl, {
          maxPoses: 1,
          flipHorizontal: true, // 镜像更符合用户直觉
        });
        
        // 减少状态日志：每120帧打印一次基本信息
        if (frameCount % 120 === 0) {
          console.log('📊 [PoseDetector] 检测状态:', {
            frameCount,
            posesDetected: poses.length,
            videoSize: { width: videoEl.videoWidth, height: videoEl.videoHeight },
            lastDirection: now - lastDirectionTime > 5000 ? '超过5秒无动作' : '最近有动作'
          });
        }
        
        if (poses[0]) {
          const pose = poses[0];
          
          // 调用关键点绘制回调
          if (onPoseDetected) {
            onPoseDetected(pose);
          }
          
          // 使用修复后的映射函数
          const mapper = mapPoseToDirection(pose);
          const dir = mapper(now);
          if (dir) {
            lastDirectionTime = now;
            console.log('🎯 [PoseDetector] 触发方向控制:', dir);
            onDirection(dir);
          }
        } else {
          // 减少无检测日志：每300帧打印一次
          if (frameCount % 300 === 0) {
            console.log('❌ [PoseDetector] 未检测到姿态 (每300帧)');
          }
        }
      } catch (error) {
        console.error('❌ [PoseDetector] 姿态检测错误:', error);
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}