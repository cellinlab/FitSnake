import React from 'react';

interface PoseDirectionVisualizerProps {
  currentPose: 'left_hand' | 'right_hand' | 'left_leg' | 'right_leg' | 'none';
  className?: string;
}

export const PoseDirectionVisualizer: React.FC<PoseDirectionVisualizerProps> = ({ 
  currentPose, 
  className = '' 
}) => {
  // 姿势到方向的映射
  const poseToDirection = {
    'left_hand': 'left',
    'right_hand': 'right', 
    'left_leg': 'down',
    'right_leg': 'up',
    'none': null
  };

  const currentDirection = poseToDirection[currentPose];

  const DirectionIndicator: React.FC<{ 
    direction: 'up' | 'down' | 'left' | 'right';
    isActive: boolean;
    icon: string;
    label: string;
  }> = ({ direction, isActive, icon, label }) => {
    return (
      <div className={`
        w-8 h-8 flex flex-col items-center justify-center
        border-2 rounded-lg font-mono font-bold text-xs
        transition-all duration-200
        ${
          isActive
            ? 'bg-blue-500 border-blue-400 text-white shadow-lg scale-105 animate-pulse'
            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
        }
      `}>
        <div className="text-xs leading-none">{icon}</div>
      </div>
    );
  };

  return (
    <div className={`${className}`}>      
      <div className="flex items-center space-x-4">
        {/* 方向指示器网格 */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">姿态</div>
          <div className="grid grid-cols-3 gap-0.5">
            <div></div>
            <DirectionIndicator 
              direction="up" 
              isActive={currentDirection === 'up'}
              icon="🦵"
              label="抬右腿"
            />
            <div></div>
            <DirectionIndicator 
              direction="left" 
              isActive={currentDirection === 'left'}
              icon="🙌"
              label="举左手"
            />
            <div className="w-8 h-8 flex items-center justify-center text-xs text-gray-500">
              ●
            </div>
            <DirectionIndicator 
              direction="right" 
              isActive={currentDirection === 'right'}
              icon="🙌"
              label="举右手"
            />
            <div></div>
            <DirectionIndicator 
              direction="down" 
              isActive={currentDirection === 'down'}
              icon="🦵"
              label="抬左腿"
            />
            <div></div>
          </div>
        </div>

        {/* 当前姿态显示 */}
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-400">当前</div>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
            currentPose !== 'none'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              currentPose !== 'none' ? 'bg-blue-300 animate-pulse' : 'bg-gray-400'
            }`}></div>
            {
              currentPose === 'left_hand' ? '举左手' :
              currentPose === 'right_hand' ? '举右手' :
              currentPose === 'left_leg' ? '抬左腿' :
              currentPose === 'right_leg' ? '抬右腿' :
              '待机'
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoseDirectionVisualizer;