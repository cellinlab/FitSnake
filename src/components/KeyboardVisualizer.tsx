import React, { useState, useEffect } from 'react';

interface KeyboardVisualizerProps {
  className?: string;
}

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  up: boolean;
  left: boolean;
  down: boolean;
  right: boolean;
  space: boolean;
}

export const KeyboardVisualizer: React.FC<KeyboardVisualizerProps> = ({ className = '' }) => {
  const [keyState, setKeyState] = useState<KeyState>({
    w: false,
    a: false,
    s: false,
    d: false,
    up: false,
    left: false,
    down: false,
    right: false,
    space: false
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      setKeyState(prev => {
        const newState = { ...prev };
        
        switch (key) {
          case 'w':
            newState.w = true;
            break;
          case 'a':
            newState.a = true;
            break;
          case 's':
            newState.s = true;
            break;
          case 'd':
            newState.d = true;
            break;
          case 'arrowup':
            newState.up = true;
            break;
          case 'arrowleft':
            newState.left = true;
            break;
          case 'arrowdown':
            newState.down = true;
            break;
          case 'arrowright':
            newState.right = true;
            break;
          case ' ':
            newState.space = true;
            break;
        }
        
        return newState;
      });
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      setKeyState(prev => {
        const newState = { ...prev };
        
        switch (key) {
          case 'w':
            newState.w = false;
            break;
          case 'a':
            newState.a = false;
            break;
          case 's':
            newState.s = false;
            break;
          case 'd':
            newState.d = false;
            break;
          case 'arrowup':
            newState.up = false;
            break;
          case 'arrowleft':
            newState.left = false;
            break;
          case 'arrowdown':
            newState.down = false;
            break;
          case 'arrowright':
            newState.right = false;
            break;
          case ' ':
            newState.space = false;
            break;
        }
        
        return newState;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const KeyButton: React.FC<{ isPressed: boolean; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }> = ({ 
    isPressed, 
    children, 
    size = 'md' 
  }) => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-16 h-8 text-sm'
    };

    return (
      <div className={`
        ${sizeClasses[size]}
        flex items-center justify-center
        border-2 rounded-lg font-mono font-bold
        transition-all duration-100
        ${isPressed 
          ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-95' 
          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
        }
      `}>
        {children}
      </div>
    );
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 text-center">⌨️ 按键状态</h3>
      
      {/* WASD 键盘布局 */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2 text-center">WASD</div>
        <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
          <div></div>
          <KeyButton isPressed={keyState.w}>W</KeyButton>
          <div></div>
          <KeyButton isPressed={keyState.a}>A</KeyButton>
          <KeyButton isPressed={keyState.s}>S</KeyButton>
          <KeyButton isPressed={keyState.d}>D</KeyButton>
        </div>
      </div>

      {/* 方向键布局 */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2 text-center">方向键</div>
        <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
          <div></div>
          <KeyButton isPressed={keyState.up}>↑</KeyButton>
          <div></div>
          <KeyButton isPressed={keyState.left}>←</KeyButton>
          <KeyButton isPressed={keyState.down}>↓</KeyButton>
          <KeyButton isPressed={keyState.right}>→</KeyButton>
        </div>
      </div>

      {/* 空格键 */}
      <div>
        <div className="text-xs text-gray-400 mb-2 text-center">开始游戏</div>
        <div className="flex justify-center">
          <KeyButton isPressed={keyState.space} size="lg">SPACE</KeyButton>
        </div>
      </div>

      {/* 状态指示 */}
      <div className="mt-3 text-xs text-center">
        <div className={`inline-flex items-center px-2 py-1 rounded-full ${
          Object.values(keyState).some(Boolean) 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-600 text-gray-300'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
            Object.values(keyState).some(Boolean) ? 'bg-green-300 animate-pulse' : 'bg-gray-400'
          }`}></div>
          {Object.values(keyState).some(Boolean) ? '按键激活' : '等待输入'}
        </div>
      </div>
    </div>
  );
};

export default KeyboardVisualizer;