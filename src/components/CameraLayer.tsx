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
  const streamRef = useRef<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  // 使用useEffect空依赖，只初始化一次
  useEffect(() => {
    let cancelled = false;

    const initCamera = async () => {
      try {
        console.log('🎥 [CameraLayer] 开始初始化摄像头...');
        
        // 检查浏览器支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('浏览器不支持摄像头访问');
        }
        console.log('✅ [CameraLayer] 浏览器支持摄像头访问');

        // 打印设备信息
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          console.log('📱 [CameraLayer] 可用摄像头设备:', videoDevices.length);
        } catch (e) {
          console.warn('⚠️ [CameraLayer] 无法枚举设备:', e);
        }

        // 请求摄像头权限
        console.log('📋 [CameraLayer] 请求摄像头权限...');
        const videoConfig = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user' // 前置摄像头
          },
          audio: false
        };
        console.log('📋 [CameraLayer] 摄像头配置:', videoConfig);
        
        const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
        
        // 检查是否被取消
        if (cancelled) {
          console.log('🚫 [CameraLayer] 初始化被取消，停止流');
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        console.log('✅ [CameraLayer] 摄像头权限获取成功, stream:', stream);
        console.log('📊 [CameraLayer] 视频轨道数量:', stream.getVideoTracks().length);
        
        if (stream.getVideoTracks().length > 0) {
          const videoTrack = stream.getVideoTracks()[0];
          console.log('📊 [CameraLayer] 视频轨道设置:', videoTrack.getSettings());
          console.log('📊 [CameraLayer] 视频轨道状态:', videoTrack.readyState);
        }

        // 立刻设置权限状态
        setHasPermission(true);
        setIsLoading(false);
        console.log('✅ [CameraLayer] 权限状态已更新');

        if (videoRef.current) {
          console.log('🎬 [CameraLayer] 绑定视频流到video元素...');
          videoRef.current.srcObject = stream;
          
          // 添加更多事件监听器用于调试
          videoRef.current.onloadstart = () => {
            console.log('📺 [CameraLayer] video.onloadstart - 开始加载视频');
          };
          
          videoRef.current.onloadeddata = () => {
            console.log('📺 [CameraLayer] video.onloadeddata - 视频数据加载完成');
          };
          
          videoRef.current.oncanplay = () => {
            console.log('📺 [CameraLayer] video.oncanplay - 视频可以播放');
          };
          
          videoRef.current.onplaying = () => {
            console.log('📺 [CameraLayer] video.onplaying - 视频开始播放');
          };
          
          videoRef.current.onerror = (e) => {
            console.error('❌ [CameraLayer] video.onerror - 视频错误:', e);
          };
          
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              console.log('📺 [CameraLayer] video.onloadedmetadata - 元数据加载完成');
              console.log('📊 [CameraLayer] 视频尺寸:', {
                videoWidth: videoRef.current.videoWidth,
                videoHeight: videoRef.current.videoHeight,
                readyState: videoRef.current.readyState
              });
              
              // 打印容器尺寸
              const container = videoRef.current.parentElement;
              if (container) {
                const rect = container.getBoundingClientRect();
                console.log('📐 [CameraLayer] 容器尺寸:', rect);
              }
              
              console.log('▶️ [CameraLayer] 开始播放视频...');
              const playPromise = videoRef.current.play();
              
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('✅ [CameraLayer] 视频播放成功');
                    console.log('🎯 [CameraLayer] 调用 onVideoReady 回调');
                    if (videoRef.current && onVideoReady) {
                      onVideoReady(videoRef.current);
                    }
                  })
                  .catch((playError) => {
                    console.error('❌ [CameraLayer] 视频播放失败:', playError);
                    // 不要回滚状态，只是打印错误
                  });
              } else {
                console.log('✅ [CameraLayer] 视频播放成功 (同步)');
                console.log('🎯 [CameraLayer] 调用 onVideoReady 回调');
                if (videoRef.current && onVideoReady) {
                  onVideoReady(videoRef.current);
                }
              }
            }
          };
          
          // 容错：如果readyState已经>=2，直接尝试播放
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState >= 2) {
              console.log('🔄 [CameraLayer] 容错播放 - readyState:', videoRef.current.readyState);
              const playPromise = videoRef.current.play();
              if (playPromise) {
                playPromise.catch(e => console.warn('⚠️ [CameraLayer] 容错播放失败:', e));
              }
            }
          }, 200);
          
        } else {
          console.warn('⚠️ [CameraLayer] videoRef.current 为 null，稍后重试');
        }
      } catch (err) {
        if (cancelled) {
          console.log('🚫 [CameraLayer] 初始化被取消');
          return;
        }
        
        console.error('❌ [CameraLayer] 摄像头初始化失败:', err);
        const errorMessage = err instanceof Error ? err.message : '摄像头访问失败';
        console.error('❌ [CameraLayer] 错误详情:', {
          name: err instanceof Error ? err.name : 'Unknown',
          message: errorMessage,
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(errorMessage);
        setIsLoading(false);
        if (onError) {
          onError(errorMessage);
        }
      }
    };

    initCamera();

    // 清理函数
    return () => {
      cancelled = true;
      console.log('🧹 [CameraLayer] 清理摄像头资源...');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          console.log('🛑 [CameraLayer] 停止视频轨道:', track.label);
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, []); // 空依赖，只运行一次

  const requestPermission = async () => {
    console.log('🔄 [CameraLayer] 用户手动请求摄像头权限...');
    setError(null);
    setIsLoading(true);
    
    try {
      // 先停止旧流
      if (streamRef.current) {
        console.log('🛑 [CameraLayer] 停止旧流');
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      const videoConfig = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      };
      console.log('📋 [CameraLayer] 手动请求配置:', videoConfig);
      
      const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
      streamRef.current = stream;
      console.log('✅ [CameraLayer] 手动请求成功, stream:', stream);

      // 立刻设置权限状态
      setHasPermission(true);
      setIsLoading(false);

      if (videoRef.current) {
        console.log('🎬 [CameraLayer] 手动绑定视频流...');
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            console.log('📺 [CameraLayer] 手动请求 - 元数据加载完成');
            console.log('▶️ [CameraLayer] 手动请求 - 开始播放视频...');
            
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('✅ [CameraLayer] 手动请求 - 视频播放成功');
                  if (videoRef.current && onVideoReady) {
                    onVideoReady(videoRef.current);
                  }
                })
                .catch((playError) => {
                  console.error('❌ [CameraLayer] 手动请求 - 视频播放失败:', playError);
                  // 不要回滚状态
                });
            } else {
              console.log('✅ [CameraLayer] 手动请求 - 视频播放成功 (同步)');
              if (videoRef.current && onVideoReady) {
                onVideoReady(videoRef.current);
              }
            }
          }
        };
      }
    } catch (err) {
      console.error('❌ [CameraLayer] 手动请求失败:', err);
      const errorMessage = err instanceof Error ? err.message : '摄像头访问失败';
      setError(errorMessage);
      setIsLoading(false);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* 始终渲染video元素 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }} // 镜像效果，避免Tailwind类名问题
        playsInline
        muted
        autoPlay
      />
      
      {/* 错误状态遮罩 */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 text-white z-10">
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
      )}
      
      {/* 加载状态遮罩 */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-90 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">正在启动摄像头...</p>
            <p className="text-sm text-gray-400 mt-2">请允许浏览器访问您的摄像头</p>
            <p className="text-xs text-gray-500 mt-2">请查看浏览器控制台获取详细日志</p>
          </div>
        </div>
      )}
      
      {/* 权限请求遮罩 */}
      {!hasPermission && !isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 text-white z-10">
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
      )}
      
      {/* 动作提示叠加层 - 只在摄像头就绪时显示 */}
      {hasPermission && !error && (
        <div className="absolute inset-0 pointer-events-none z-5">
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-3 rounded-lg text-sm backdrop-blur-sm">
            <div className="space-y-1">
              <div className="text-yellow-400 font-medium mb-2">🎮 动作控制</div>
              <div>🙌 举左手 = 向左</div>
              <div>🙌 举右手 = 向右</div>
              <div>🦵 抬左腿 = 向下</div>
              <div>🦵 抬右腿 = 向上</div>
            </div>
          </div>
          
          {/* 状态指示器 */}
          <div className="absolute bottom-4 right-4 bg-green-500 bg-opacity-90 text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
            📹 摄像头已就绪
          </div>
        </div>
      )}
    </div>
  );
};