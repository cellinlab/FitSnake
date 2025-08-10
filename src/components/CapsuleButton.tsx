import React from 'react';

interface CapsuleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const CapsuleButton: React.FC<CapsuleButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-lg hover:shadow-xl',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500 shadow-lg hover:shadow-xl',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-lg hover:shadow-xl',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-lg hover:shadow-xl',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-black focus:ring-yellow-400 shadow-lg hover:shadow-xl'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {icon && (
        <span className="flex-shrink-0">
          {icon}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
};

// 预设的游戏控制按钮组件
export const GameControlButton: React.FC<{
  action: 'start' | 'pause' | 'restart' | 'stop';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ action, onClick, disabled, className }) => {
  const configs = {
    start: {
      variant: 'success' as const,
      icon: '▶️',
      text: '开始游戏'
    },
    pause: {
      variant: 'warning' as const,
      icon: '⏸️',
      text: '暂停'
    },
    restart: {
      variant: 'primary' as const,
      icon: '🔄',
      text: '重新开始'
    },
    stop: {
      variant: 'danger' as const,
      icon: '⏹️',
      text: '停止'
    }
  };
  
  const config = configs[action];
  
  return (
    <CapsuleButton
      variant={config.variant}
      onClick={onClick}
      disabled={disabled}
      className={className}
      icon={<span className="text-lg">{config.icon}</span>}
    >
      {config.text}
    </CapsuleButton>
  );
};

// 方向控制按钮组件（调试用）
export const DirectionButton: React.FC<{
  direction: 'up' | 'down' | 'left' | 'right';
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}> = ({ direction, onClick, disabled, className }) => {
  const configs = {
    up: {
      icon: '⬆️',
      text: '上'
    },
    down: {
      icon: '⬇️',
      text: '下'
    },
    left: {
      icon: '⬅️',
      text: '左'
    },
    right: {
      icon: '➡️',
      text: '右'
    }
  };
  
  const config = configs[direction];
  
  return (
    <CapsuleButton
      variant="secondary"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={className}
      icon={<span className="text-base">{config.icon}</span>}
    >
      {config.text}
    </CapsuleButton>
  );
};

// 姿态状态指示器
export const PoseIndicator: React.FC<{
  pose: 'left_hand' | 'right_hand' | 'left_leg' | 'right_leg' | 'none';
  className?: string;
}> = ({ pose, className }) => {
  const configs = {
    left_hand: {
      icon: '🙌',
      text: '举左手',
      color: 'bg-blue-500'
    },
    right_hand: {
      icon: '🙌',
      text: '举右手',
      color: 'bg-green-500'
    },
    left_leg: {
      icon: '🦵',
      text: '抬左腿',
      color: 'bg-yellow-500'
    },
    right_leg: {
      icon: '🦵',
      text: '抬右腿',
      color: 'bg-red-500'
    },
    none: {
      icon: '🧘',
      text: '待机',
      color: 'bg-gray-500'
    }
  };
  
  const config = configs[pose];
  
  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium ${config.color} ${className}`}>
      <span className="mr-2 text-base">{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};