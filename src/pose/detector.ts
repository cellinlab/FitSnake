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