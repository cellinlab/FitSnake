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
      sm: 'w-6 h-6 text-xs',
      md: 'w-12 h-6 text-xs',
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
    <div className={`${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center">
          <span className="mr-2">⌨️</span>
          按键状态
        </h3>
        
        {/* 横向排列的控制区域 */}
        <div className="flex items-center space-x-4">
          {/* WASD 键盘布局 - 紧凑版 */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">WASD</div>
            <div className="grid grid-cols-3 gap-0.5">
              <div></div>
              <KeyButton isPressed={keyState.w} size="sm">W</KeyButton>
              <div></div>
              <KeyButton isPressed={keyState.a} size="sm">A</KeyButton>
              <KeyButton isPressed={keyState.s} size="sm">S</KeyButton>
              <KeyButton isPressed={keyState.d} size="sm">D</KeyButton>
            </div>
          </div>

          {/* 空格键 */}
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-400">开始</div>
            <KeyButton isPressed={keyState.space} size="md">SPACE</KeyButton>
          </div>

          {/* 状态指示 */}
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            Object.values(keyState).some(Boolean) 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              Object.values(keyState).some(Boolean) ? 'bg-green-300 animate-pulse' : 'bg-gray-400'
            }`}></div>
            {Object.values(keyState).some(Boolean) ? '激活' : '待机'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardVisualizer;