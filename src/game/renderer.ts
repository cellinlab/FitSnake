import { GameState, Position } from './engine';

export interface RenderConfig {
  cellSize: number;
  gridWidth: number;
  gridHeight: number;
  colors: {
    background: string;
    snake: string;
    food: string;
    grid: string;
    actionZone: string;
    text: string;
  };
}

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RenderConfig;

  constructor(canvas: HTMLCanvasElement, config: RenderConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    
    // 设置画布尺寸
    this.canvas.width = config.gridWidth * config.cellSize;
    this.canvas.height = config.gridHeight * config.cellSize;
    
    // 优化渲染性能
    this.ctx.imageSmoothingEnabled = false;
  }

  public render(gameState: GameState): void {
    this.clear();
    this.drawGrid();
    this.drawActionZone();
    
    if (gameState.gameStarted) {
      this.drawFood(gameState.food);
      this.drawSnake(gameState.snake);
    }
    
    this.drawScore(gameState.score);
    
    if (gameState.gameOver) {
      this.drawGameOver();
    }
  }

  private clear(): void {
    this.ctx.fillStyle = this.config.colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = this.config.colors.grid;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.3;
    
    // 绘制垂直线
    for (let x = 0; x <= this.config.gridWidth; x++) {
      const xPos = x * this.config.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, 0);
      this.ctx.lineTo(xPos, this.canvas.height);
      this.ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= this.config.gridHeight; y++) {
      const yPos = y * this.config.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(0, yPos);
      this.ctx.lineTo(this.canvas.width, yPos);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  private drawActionZone(): void {
    const margin = 2; // 网格单位
    const x = margin * this.config.cellSize;
    const y = margin * this.config.cellSize;
    const width = (this.config.gridWidth - margin * 2) * this.config.cellSize;
    const height = (this.config.gridHeight - margin * 2) * this.config.cellSize;
    
    this.ctx.strokeStyle = this.config.colors.actionZone;
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(x, y, width, height);
    this.ctx.setLineDash([]);
  }

  private drawSnake(snake: Position[]): void {
    this.ctx.fillStyle = this.config.colors.snake;
    
    snake.forEach((segment, index) => {
      const x = segment.x * this.config.cellSize;
      const y = segment.y * this.config.cellSize;
      
      // 蛇头稍微大一点
      if (index === 0) {
        this.ctx.fillRect(
          x + 1, 
          y + 1, 
          this.config.cellSize - 2, 
          this.config.cellSize - 2
        );
        
        // 蛇头眼睛
        this.ctx.fillStyle = this.config.colors.background;
        const eyeSize = 3;
        const eyeOffset = 6;
        this.ctx.fillRect(x + eyeOffset, y + eyeOffset, eyeSize, eyeSize);
        this.ctx.fillRect(x + this.config.cellSize - eyeOffset - eyeSize, y + eyeOffset, eyeSize, eyeSize);
        
        this.ctx.fillStyle = this.config.colors.snake;
      } else {
        this.ctx.fillRect(
          x + 2, 
          y + 2, 
          this.config.cellSize - 4, 
          this.config.cellSize - 4
        );
      }
    });
  }

  private drawFood(food: Position): void {
    const x = food.x * this.config.cellSize + this.config.cellSize / 2;
    const y = food.y * this.config.cellSize + this.config.cellSize / 2;
    const radius = this.config.cellSize / 2 - 2;
    
    this.ctx.fillStyle = this.config.colors.food;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 食物光晕效果
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawScore(score: number): void {
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'right';
    
    // 文字阴影
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillText(
      `Score: ${score}`, 
      this.canvas.width - 20, 
      40
    );
    
    // 重置阴影
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
  }

  private drawGameOver(): void {
    // 半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Game Over 文字
    this.ctx.fillStyle = this.config.colors.text;
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    this.ctx.shadowBlur = 6;
    
    this.ctx.fillText(
      'Game Over!', 
      this.canvas.width / 2, 
      this.canvas.height / 2 - 20
    );
    
    // 重置阴影
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    
    // 重新计算网格配置
    this.config.cellSize = Math.min(
      width / this.config.gridWidth,
      height / this.config.gridHeight
    );
  }
}