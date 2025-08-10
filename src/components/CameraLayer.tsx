import React, { useRef, useEffect, useState } from 'react';

interface CameraLayerProps {
  onVideoReady?: (video: HTMLVideoElement) => void;
  onError?: (error: string) => void;
  className?: string;
}

export const CameraLayer: React.FC<CameraLayerProps> = ({
  onVideoReady,
  onError,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 请求摄像头权限
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user' // 前置摄像头
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setHasPermission(true);
              setIsLoading(false);
              onVideoReady?.(videoRef.current);
            }
          };
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '摄像头访问失败';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(errorMessage);
      }
    };

    initCamera();

    // 清理函数
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onVideoReady, onError]);

  const requestPermission = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setHasPermission(true);
            setIsLoading(false);
            onVideoReady?.(videoRef.current);
          }
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '摄像头访问失败';
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  };

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-bold mb-2">摄像头访问失败</h3>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={requestPermission}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            重新尝试
          </button>
          <div className="mt-4 text-sm text-gray-400">
            <p>请确保：</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>浏览器支持摄像头访问</li>
              <li>已授权摄像头权限</li>
              <li>摄像头未被其他应用占用</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">正在启动摄像头...</p>
          <p className="text-sm text-gray-400 mt-2">请允许浏览器访问您的摄像头</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-bold mb-2">开始 FitSnake 燃脂贪吃蛇</h3>
          <p className="text-gray-300 mb-6">通过举手抬腿控制贪吃蛇，一边游戏一边燃脂！</p>
          <button
            onClick={requestPermission}
            className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-full text-lg transition-colors"
          >
            启动摄像头
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform scale-x-[-1]" // 镜像效果
        playsInline
        muted
      />
      
      {/* 动作提示叠加层 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
          <div className="space-y-1">
            <div>🙌 举左手 = 向左</div>
            <div>🙌 举右手 = 向右</div>
            <div>🦵 抬左腿 = 向下</div>
            <div>🦵 抬右腿 = 向上</div>
          </div>
        </div>
        
        {/* 状态指示器 */}
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
          📹 摄像头已就绪
        </div>
      </div>
    </div>
  );
};