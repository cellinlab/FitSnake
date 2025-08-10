import React, { useRef, useEffect, useCallback } from 'react';
import { SnakeEngine } from '../game/engine';
import { CanvasRenderer } from '../game/renderer';
import { calculateOptimalGrid } from '../utils/grid';

interface GameCanvasProps {
  gameEngine: SnakeEngine;
  className?: string;
  onGameOver?: (score: number) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameEngine,
  className = '',
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 游戏逻辑更新循环
  const gameLoop = useCallback(() => {
    if (gameEngine && gameEngine.getState().gameStarted && !gameEngine.getState().gameOver) {
      gameEngine.update();
    }
  }, [gameEngine]);

  // 渲染循环
  const renderLoop = useCallback(() => {
    if (rendererRef.current && gameEngine) {
      rendererRef.current.render(gameEngine.getState());
    }
    animationFrameRef.current = requestAnimationFrame(renderLoop);
  }, [gameEngine]);

  // 初始化Canvas和渲染器
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const gridConfig = calculateOptimalGrid(
      containerRect.width,
      containerRect.height,
      15, // 最小格子大小
      30  // 最大格子大小
    );

    // 设置Canvas尺寸
    const canvasWidth = gridConfig.width * gridConfig.cellSize;
    const canvasHeight = gridConfig.height * gridConfig.cellSize;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;

    // 创建渲染器
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const renderConfig = {
        cellSize: gridConfig.cellSize,
        gridWidth: gridConfig.width,
        gridHeight: gridConfig.height,
        colors: {
          background: '#1a1a1a',
          snake: '#4ade80',
          food: '#f59e0b',
          grid: '#374151',
          actionZone: '#3b82f6',
          text: '#ffffff'
        }
      };
      rendererRef.current = new CanvasRenderer(canvas, renderConfig);
      
      // 初始化游戏引擎的网格配置
      gameEngine.reset();
      
      // 开始渲染循环
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      renderLoop();
      
      // 开始游戏逻辑循环
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      gameLoopRef.current = setInterval(gameLoop, 150); // 每150ms更新一次游戏状态
    }
  }, [gameEngine, renderLoop]);

  // 处理窗口大小变化
  const handleResize = useCallback(() => {
    // 延迟执行以确保容器尺寸已更新
    setTimeout(initializeCanvas, 100);
  }, [initializeCanvas]);

  // 监听游戏状态变化
  useEffect(() => {
    const handleGameStateChange = (state: any) => {
      if (state.gameOver && onGameOver) {
        onGameOver(state.score);
      }
    };

    gameEngine.stateChangeCallback = handleGameStateChange;

    return () => {
      // 清理监听器（如果GameEngine提供了移除方法）
      // gameEngine.removeStateChangeListener(handleGameStateChange);
    };
  }, [gameEngine, onGameOver]);

  // 组件挂载时初始化
  useEffect(() => {
    initializeCanvas();
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [initializeCanvas, handleResize]);

  // 键盘控制（调试用）
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!gameEngine.getState().gameStarted) return;
      
      switch (event.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
          gameEngine.setDirection('up');
          break;
        case 'arrowdown':
        case 's':
          gameEngine.setDirection('down');
          break;
        case 'arrowleft':
        case 'a':
          gameEngine.setDirection('left');
          break;
        case 'arrowright':
        case 'd':
          gameEngine.setDirection('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameEngine]);

  return (
    <div 
      ref={containerRef}
      className={`flex items-center justify-center bg-gray-900 ${className}`}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-700 rounded-lg shadow-2xl"
          style={{
            imageRendering: 'pixelated', // 保持像素风格
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />
        
        {/* 游戏状态叠加层 */}
        {!gameEngine.getState().gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
            <div className="text-center text-white">
              <div className="text-4xl mb-4">🐍</div>
              <h2 className="text-2xl font-bold mb-2">FitSnake 燃脂贪吃蛇</h2>
              <p className="text-gray-300 mb-4">做动作开始游戏！</p>
              <div className="text-sm text-gray-400">
                <p>键盘调试：WASD 或 方向键</p>
              </div>
            </div>
          </div>
        )}
        
        {/* 分数显示 */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
          <div className="text-lg font-bold">分数: {gameEngine.getState().score}</div>
          <div className="text-sm text-gray-300">长度: {gameEngine.getState().snake.length}</div>
        </div>
        
        {/* 游戏结束时的重新开始提示 */}
        {gameEngine.getState().gameOver && (
          <div className="absolute bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg">
            <div className="text-sm">做任意动作重新开始</div>
          </div>
        )}
      </div>
    </div>
  );
};