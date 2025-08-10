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

    // 打印关键点信息
    console.log('🎯 [PoseDetector] 关键点检测:', {
      right_wrist: k['right_wrist'] ? { x: k['right_wrist'].x.toFixed(2), y: k['right_wrist'].y.toFixed(2), score: k['right_wrist'].score?.toFixed(2) } : 'N/A',
      right_shoulder: k['right_shoulder'] ? { x: k['right_shoulder'].x.toFixed(2), y: k['right_shoulder'].y.toFixed(2), score: k['right_shoulder'].score?.toFixed(2) } : 'N/A',
      left_wrist: k['left_wrist'] ? { x: k['left_wrist'].x.toFixed(2), y: k['left_wrist'].y.toFixed(2), score: k['left_wrist'].score?.toFixed(2) } : 'N/A',
      left_shoulder: k['left_shoulder'] ? { x: k['left_shoulder'].x.toFixed(2), y: k['left_shoulder'].y.toFixed(2), score: k['left_shoulder'].score?.toFixed(2) } : 'N/A',
      right_knee: k['right_knee'] ? { x: k['right_knee'].x.toFixed(2), y: k['right_knee'].y.toFixed(2), score: k['right_knee'].score?.toFixed(2) } : 'N/A',
      right_hip: k['right_hip'] ? { x: k['right_hip'].x.toFixed(2), y: k['right_hip'].y.toFixed(2), score: k['right_hip'].score?.toFixed(2) } : 'N/A',
      left_knee: k['left_knee'] ? { x: k['left_knee'].x.toFixed(2), y: k['left_knee'].y.toFixed(2), score: k['left_knee'].score?.toFixed(2) } : 'N/A',
      left_hip: k['left_hip'] ? { x: k['left_hip'].x.toFixed(2), y: k['left_hip'].y.toFixed(2), score: k['left_hip'].score?.toFixed(2) } : 'N/A'
    });

    // y 越小表示位置越高（相机坐标）
    const upRight = s('right_wrist') && s('right_shoulder') &&
                    k['right_wrist'].y < k['right_shoulder'].y;
    const upLeft  = s('left_wrist') && s('left_shoulder') &&
                    k['left_wrist'].y  < k['left_shoulder'].y;
    const kneeUpR = s('right_knee') && s('right_hip') &&
                    k['right_knee'].y  < k['right_hip'].y;
    const kneeUpL = s('left_knee') && s('left_hip') &&
                    k['left_knee'].y   < k['left_hip'].y;

    // 打印姿态判断逻辑
    console.log('🤖 [PoseDetector] 姿态判断:', {
      upRight: upRight,
      upLeft: upLeft,
      kneeUpR: kneeUpR,
      kneeUpL: kneeUpL,
      minScore: minScore
    });

    let dir: Direction = null;
    if (upRight) dir = 'right';
    else if (upLeft) dir = 'left';
    else if (kneeUpR) dir = 'up';
    else if (kneeUpL) dir = 'down';

    console.log('🎮 [PoseDetector] 检测到方向:', dir);

    if (!dir) return null;

    if (dir !== lastDir) {
      lastDir = dir;
      lastTs = now;
      console.log('⏱️ [PoseDetector] 方向变化，开始计时:', { dir, holdMs });
      return null; // 开始计时，等待稳定
    }
    if (now - lastTs >= holdMs) {
      console.log('✅ [PoseDetector] 方向稳定，触发:', { dir, holdTime: now - lastTs });
      return dir; // 稳定超过阈值，触发方向
    }
    console.log('⏳ [PoseDetector] 等待稳定:', { dir, elapsed: now - lastTs, needed: holdMs });
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
        
        if (frameCount % 60 === 0) { // 每60帧打印一次基本信息
          console.log('📊 [PoseDetector] 检测状态:', {
            frameCount,
            posesDetected: poses.length,
            videoSize: { width: videoEl.videoWidth, height: videoEl.videoHeight }
          });
        }
        
        if (poses[0]) {
          const pose = poses[0];
          console.log('👤 [PoseDetector] 检测到姿态, 关键点数量:', pose.keypoints.length);
          
          // 调用关键点绘制回调
          if (onPoseDetected) {
            onPoseDetected(pose);
          }
          
          // 为当前帧创建一个映射函数（闭包保存lastDir/lastTs）
          const mapper = mapPoseToDirection(pose);
          const dir = mapper(now);
          if (dir) {
            console.log('🎯 [PoseDetector] 触发方向控制:', dir);
            onDirection(dir);
          }
        } else {
          if (frameCount % 120 === 0) { // 每120帧打印一次无检测信息
            console.log('❌ [PoseDetector] 未检测到姿态');
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