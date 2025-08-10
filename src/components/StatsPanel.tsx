import React from 'react';

interface GameStats {
  score: number;
  snakeLength: number;
  gameTime: number; // 游戏时长（秒）
  movesCount: number; // 移动次数
  foodEaten: number; // 吃到的食物数量
}

interface FitnessStats {
  leftHandRaises: number;
  rightHandRaises: number;
  leftLegRaises: number;
  rightLegRaises: number;
  totalMoves: number;
  caloriesBurned: number; // 估算消耗卡路里
}

interface StatsPanelProps {
  gameStats: GameStats;
  fitnessStats: FitnessStats;
  isGameActive: boolean;
  className?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  gameStats,
  fitnessStats,
  isGameActive,
  className = ''
}) => {
  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算平均每分钟动作数
  const getMovesPerMinute = (): number => {
    if (gameStats.gameTime === 0) return 0;
    return Math.round((fitnessStats.totalMoves / gameStats.gameTime) * 60);
  };

  return (
    <div className={`bg-gray-800 text-white rounded-lg p-6 space-y-6 ${className}`}>
      {/* 游戏统计 */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="mr-2">🎮</span>
          游戏统计
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{gameStats.score}</div>
            <div className="text-sm text-gray-300">分数</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{gameStats.snakeLength}</div>
            <div className="text-sm text-gray-300">蛇身长度</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{formatTime(gameStats.gameTime)}</div>
            <div className="text-sm text-gray-300">游戏时长</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{gameStats.foodEaten}</div>
            <div className="text-sm text-gray-300">食物数量</div>
          </div>
        </div>
      </div>

      {/* 健身统计 */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="mr-2">💪</span>
          健身统计
        </h3>
        <div className="space-y-3">
          {/* 动作统计 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-600 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{fitnessStats.leftHandRaises}</div>
              <div className="text-xs">🙌 左手举起</div>
            </div>
            <div className="bg-green-600 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{fitnessStats.rightHandRaises}</div>
              <div className="text-xs">🙌 右手举起</div>
            </div>
            <div className="bg-yellow-600 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{fitnessStats.leftLegRaises}</div>
              <div className="text-xs">🦵 左腿抬起</div>
            </div>
            <div className="bg-red-600 rounded-lg p-3 text-center">
              <div className="text-xl font-bold">{fitnessStats.rightLegRaises}</div>
              <div className="text-xs">🦵 右腿抬起</div>
            </div>
          </div>
          
          {/* 总体统计 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-400">{fitnessStats.totalMoves}</div>
              <div className="text-xs text-gray-300">总动作数</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-pink-400">{getMovesPerMinute()}</div>
              <div className="text-xs text-gray-300">动作/分钟</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-red-400">{fitnessStats.caloriesBurned}</div>
              <div className="text-xs text-gray-300">卡路里</div>
            </div>
          </div>
        </div>
      </div>

      {/* 实时状态 */}
      <div className="border-t border-gray-600 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isGameActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-300">
              {isGameActive ? '游戏进行中' : '游戏暂停'}
            </span>
          </div>
          
          {/* 燃脂效果指示 */}
          {fitnessStats.totalMoves > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              <span className="text-orange-400">🔥</span>
              <span className="text-gray-300">燃脂中</span>
            </div>
          )}
        </div>
      </div>

      {/* 鼓励信息 */}
      {fitnessStats.totalMoves > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-4 text-center">
          <div className="text-sm font-medium">
            {fitnessStats.totalMoves < 10 && "🌟 继续加油，动起来！"}
            {fitnessStats.totalMoves >= 10 && fitnessStats.totalMoves < 50 && "💪 很棒！保持这个节奏！"}
            {fitnessStats.totalMoves >= 50 && fitnessStats.totalMoves < 100 && "🔥 燃脂效果显著！"}
            {fitnessStats.totalMoves >= 100 && "🏆 健身达人！你太棒了！"}
          </div>
        </div>
      )}
    </div>
  );
};

// 简化版统计组件（用于游戏界面叠加）
export const MiniStatsOverlay: React.FC<{
  score: number;
  moves: number;
  calories: number;
  className?: string;
}> = ({ score, moves, calories, className = '' }) => {
  return (
    <div className={`bg-black bg-opacity-75 text-white rounded-lg p-3 ${className}`}>
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <span>🎯</span>
          <span>{score}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>💪</span>
          <span>{moves}</span>
        </div>
        <div className="flex items-center space-x-1">
          <span>🔥</span>
          <span>{calories}</span>
        </div>
      </div>
    </div>
  );
};