import { Direction } from '../pose/detector';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  gameOver: boolean;
  gameStarted: boolean;
}

export class SnakeEngine {
  private gridWidth: number;
  private gridHeight: number;
  private state: GameState;
  public stateChangeCallback?: (state: GameState) => void;

  constructor(gridWidth: number, gridHeight: number) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const centerX = Math.floor(this.gridWidth / 2);
    const centerY = Math.floor(this.gridHeight / 2);
    
    return {
      snake: [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
      ],
      food: this.generateFood([{ x: centerX, y: centerY }]),
      direction: 'right',
      score: 0,
      gameOver: false,
      gameStarted: false
    };
  }

  private generateFood(snake: Position[]): Position {
    let food: Position;
    do {
      food = {
        x: Math.floor(Math.random() * this.gridWidth),
        y: Math.floor(Math.random() * this.gridHeight)
      };
    } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
    
    return food;
  }

  public setDirection(direction: Direction): void {
    if (!direction || !this.state.gameStarted) return;
    
    // 防止反向移动
    const opposites: Record<Direction, Direction> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left'
    };
    
    if (this.state.direction && opposites[direction] === this.state.direction) {
      return;
    }
    
    this.state.direction = direction;
  }

  public startGame(): void {
    this.state = this.createInitialState();
    this.state.gameStarted = true;
    this.notifyStateChange();
  }

  public update(): void {
    if (!this.state.gameStarted || this.state.gameOver || !this.state.direction) {
      return;
    }

    const head = { ...this.state.snake[0] };
    
    // 移动蛇头
    switch (this.state.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }

    // 检查墙壁碰撞
    if (head.x < 0 || head.x >= this.gridWidth || 
        head.y < 0 || head.y >= this.gridHeight) {
      this.state.gameOver = true;
      this.notifyStateChange();
      return;
    }

    // 检查自身碰撞
    if (this.state.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.state.gameOver = true;
      this.notifyStateChange();
      return;
    }

    // 添加新头部
    this.state.snake.unshift(head);

    // 检查食物碰撞
    if (head.x === this.state.food.x && head.y === this.state.food.y) {
      this.state.score += 10;
      this.state.food = this.generateFood(this.state.snake);
    } else {
      // 移除尾部（如果没吃到食物）
      this.state.snake.pop();
    }

    this.notifyStateChange();
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public onStateChange(callback: (state: GameState) => void): void {
    this.stateChangeCallback = callback;
  }

  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.getState());
    }
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.notifyStateChange();
  }

  // 动态更新网格尺寸
  public updateGridSize(gridWidth: number, gridHeight: number): void {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    // 如果游戏正在进行，需要重新生成食物确保在新边界内
    if (this.state.gameStarted && !this.state.gameOver) {
      // 检查当前食物是否在新边界内
      if (this.state.food.x >= gridWidth || this.state.food.y >= gridHeight) {
        this.state.food = this.generateFood(this.state.snake);
      }
      // 检查蛇是否在新边界内，如果不在则游戏结束
      const outOfBounds = this.state.snake.some(segment => 
        segment.x >= gridWidth || segment.y >= gridHeight
      );
      if (outOfBounds) {
        this.state.gameOver = true;
        this.notifyStateChange();
      }
    }
  }

  // 获取当前网格尺寸
  public getGridSize(): { width: number; height: number } {
    return { width: this.gridWidth, height: this.gridHeight };
  }
}