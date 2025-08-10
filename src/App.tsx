import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraLayer } from './components/CameraLayer';
import { GameCanvas } from './components/GameCanvas';
import { StatsPanel, MiniStatsOverlay } from './components/StatsPanel';
import { CapsuleButton, GameControlButton, PoseIndicator } from './components/CapsuleButton';
import { SnakeEngine } from './game/engine';
import { createMoveNetDetector, mapPoseToDirection, startEstimateLoop, Direction } from './pose/detector';

interface AppState {
  gameEngine: SnakeEngine | null;
  poseDetector: any | null;
  currentPose: 'left_hand' | 'right_hand' | 'left_leg' | 'right_leg' | 'none';
  isDetectionActive: boolean;
  gameStats: {
    score: number;
    snakeLength: number;
    gameTime: number;
    movesCount: number;
    foodEaten: number;
  };
  fitnessStats: {
    leftHandRaises: number;
    rightHandRaises: number;
    leftLegRaises: number;
    rightLegRaises: number;
    totalMoves: number;
    caloriesBurned: number;
  };
  showStats: boolean;
  gameStartTime: number | null;
}

function App() {
  const [state, setState] = useState<AppState>({
    gameEngine: null,
    poseDetector: null,
    currentPose: 'none',
    isDetectionActive: false,
    gameStats: {
      score: 0,
      snakeLength: 1,
      gameTime: 0,
      movesCount: 0,
      foodEaten: 0
    },
    fitnessStats: {
      leftHandRaises: 0,
      rightHandRaises: 0,
      leftLegRaises: 0,
      rightLegRaises: 0,
      totalMoves: 0,
      caloriesBurned: 0
    },
    showStats: false,
    gameStartTime: null
  });

  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化游戏引擎
  useEffect(() => {
    const engine = new SnakeEngine(20, 15);
    setState(prev => ({ ...prev, gameEngine: engine }));

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, []);

  // 游戏时间计时器
  useEffect(() => {
    if (state.gameStartTime && state.gameEngine?.getState().gameStarted) {
      gameTimerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          gameStats: {
            ...prev.gameStats,
            gameTime: Math.floor((Date.now() - (state.gameStartTime || 0)) / 1000)
          }
        }));
      }, 1000);
    } else {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
        gameTimerRef.current = null;
      }
    }

    return () => {
      if (gameTimerRef.current) {
        clearInterval(gameTimerRef.current);
      }
    };
  }, [state.gameStartTime, state.gameEngine?.getState().gameStarted]);

  // 处理摄像头就绪
  const handleVideoReady = useCallback(async (video: HTMLVideoElement) => {
    try {
      const detector = await createMoveNetDetector();
      
      setState(prev => ({ ...prev, poseDetector: detector, isDetectionActive: true }));
      
      // 开始姿态检测
      await startEstimateLoop(
        video,
        detector,
        (direction: Direction) => {
          if (state.gameEngine) {
            // 更新健身统计
            setState(prev => {
              const newStats = { ...prev.fitnessStats };
              
              switch (direction) {
                case 'left':
                  newStats.leftHandRaises++;
                  break;
                case 'right':
                  newStats.rightHandRaises++;
                  break;
                case 'down':
                  newStats.leftLegRaises++;
                  break;
                case 'up':
                  newStats.rightLegRaises++;
                  break;
              }
              
              newStats.totalMoves++;
              newStats.caloriesBurned = Math.floor(newStats.totalMoves * 0.5); // 估算卡路里
              
              return {
                ...prev,
                fitnessStats: newStats,
                gameStats: {
                  ...prev.gameStats,
                  movesCount: prev.gameStats.movesCount + 1
                }
              };
            });
            
            // 如果游戏未开始，则开始游戏
            if (!state.gameEngine.getState().gameStarted) {
              state.gameEngine.startGame();
              setState(prev => ({ ...prev, gameStartTime: Date.now() }));
            }
            
            // 设置游戏方向
            state.gameEngine.setDirection(direction);
          }
        }
      );
    } catch (error) {
      console.error('姿态检测初始化失败:', error);
    }
  }, [state.gameEngine]);

  // 处理游戏结束
  const handleGameOver = useCallback((score: number) => {
    setState(prev => ({
      ...prev,
      gameStats: {
        ...prev.gameStats,
        score
      }
    }));
  }, []);

  // 重新开始游戏
  const handleRestart = useCallback(() => {
    if (state.gameEngine) {
      state.gameEngine.reset(); // 重置游戏
      setState(prev => ({
        ...prev,
        gameStats: {
          score: 0,
          snakeLength: 1,
          gameTime: 0,
          movesCount: 0,
          foodEaten: 0
        },
        gameStartTime: null
      }));
    }
  }, [state.gameEngine]);

  // 切换统计面板显示
  const toggleStats = useCallback(() => {
    setState(prev => ({ ...prev, showStats: !prev.showStats }));
  }, []);

  // 更新游戏统计
  useEffect(() => {
    if (state.gameEngine) {
      const updateStats = () => {
        const gameState = state.gameEngine!.getState();
        setState(prev => ({
          ...prev,
          gameStats: {
            ...prev.gameStats,
            score: gameState.score,
            snakeLength: gameState.snake.length,
            foodEaten: gameState.score // 分数等于吃到的食物数量
          }
        }));
      };

      state.gameEngine.stateChangeCallback = updateStats;
    }
  }, [state.gameEngine]);

  if (!state.gameEngine) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>正在初始化游戏引擎...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 头部 */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-yellow-400">🐍 FitSnake 燃脂贪吃蛇</h1>
            <PoseIndicator pose={state.currentPose} />
          </div>
          
          <div className="flex items-center space-x-4">
            <MiniStatsOverlay
              score={state.gameStats.score}
              moves={state.fitnessStats.totalMoves}
              calories={state.fitnessStats.caloriesBurned}
            />
            
            <CapsuleButton
              variant="secondary"
              size="sm"
              onClick={toggleStats}
              icon={<span>📊</span>}
            >
              {state.showStats ? '隐藏' : '统计'}
            </CapsuleButton>
            
            <GameControlButton
              action="restart"
              onClick={handleRestart}
            />
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 摄像头区域 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">📹</span>
                姿态识别
              </h2>
              <CameraLayer
                onVideoReady={handleVideoReady}
                onError={(error) => console.error('摄像头错误:', error)}
                className="aspect-video rounded-lg overflow-hidden"
              />
              
              {/* 检测状态 */}
              <div className="mt-4 text-center">
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
              </div>
            </div>
          </div>

          {/* 游戏区域 */}
          <div className={`${state.showStats ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <span className="mr-2">🎮</span>
                游戏画面
              </h2>
              <GameCanvas
                gameEngine={state.gameEngine}
                onGameOver={handleGameOver}
                className="aspect-video"
              />
            </div>
          </div>

          {/* 统计面板 */}
          {state.showStats && (
            <div className="lg:col-span-1">
              <StatsPanel
                gameStats={state.gameStats}
                fitnessStats={state.fitnessStats}
                isGameActive={state.gameEngine.getState().gameStarted && !state.gameEngine.getState().gameOver}
              />
            </div>
          )}
        </div>

        {/* 游戏说明 */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 游戏说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-yellow-400">控制方式</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>🙌 举左手 = 向左移动</li>
                <li>🙌 举右手 = 向右移动</li>
                <li>🦵 抬左腿 = 向下移动</li>
                <li>🦵 抬右腿 = 向上移动</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-green-400">游戏目标</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>🍎 吃食物让蛇身变长</li>
                <li>💪 通过动作控制燃烧卡路里</li>
                <li>🏆 挑战更高分数</li>
                <li>⚡ 避免撞墙或撞到自己</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
