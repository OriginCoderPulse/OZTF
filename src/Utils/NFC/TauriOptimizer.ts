import { invoke } from "@tauri-apps/api/core";

/**
 * Tauri命令调用优化工具类
 * 防止主线程阻塞，提供超时控制和命令队列管理
 */
class TauriCommandOptimizer {
  private static instance: TauriCommandOptimizer;
  private commandQueue: Map<string, AbortController> = new Map();
  private commandStats: Map<string, { count: number; avgTime: number }> = new Map();

  static getInstance(): TauriCommandOptimizer {
    if (!TauriCommandOptimizer.instance) {
      TauriCommandOptimizer.instance = new TauriCommandOptimizer();
    }
    return TauriCommandOptimizer.instance;
  }

  /**
   * 执行Tauri命令，带超时和队列管理
   * @param command 命令名称
   * @param args 命令参数
   * @param timeout 超时时间（毫秒）
   * @returns 命令结果
   */
  async invokeCommand<T>(command: string, args?: any, timeout = 5000): Promise<T> {
    const startTime = Date.now();

    // 检查是否已有相同命令在执行
    if (this.commandQueue.has(command)) {
      const existingController = this.commandQueue.get(command)!;
      existingController.abort();
      this.commandQueue.delete(command);
    }

    // 创建新的AbortController用于取消操作
    const controller = new AbortController();
    this.commandQueue.set(command, controller);

    try {
      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Command ${command} timeout after ${timeout}ms`));
        }, timeout);

        // 监听abort事件
        controller.signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error(`Command ${command} was cancelled`));
        });
      });

      // 执行命令
      const commandPromise = invoke<T>(command, args);

      // 竞争执行
      const result = await Promise.race([commandPromise, timeoutPromise]);

      // 记录统计信息
      this.updateCommandStats(command, Date.now() - startTime);

      // 执行成功后清理
      this.commandQueue.delete(command);
      return result;
    } catch (error) {
      this.commandQueue.delete(command);
      throw error;
    }
  }

  /**
   * 取消指定命令
   * @param command 命令名称
   */
  cancelCommand(command: string): void {
    if (this.commandQueue.has(command)) {
      const controller = this.commandQueue.get(command)!;
      controller.abort();
      this.commandQueue.delete(command);
    }
  }

  /**
   * 取消所有正在执行的命令
   */
  cancelAllCommands(): void {
    this.commandQueue.forEach((controller) => {
      controller.abort();
    });
    this.commandQueue.clear();
  }

  /**
   * 获取命令统计信息
   * @param command 命令名称
   * @returns 统计信息
   */
  getCommandStats(command: string): { count: number; avgTime: number } | undefined {
    return this.commandStats.get(command);
  }

  /**
   * 获取所有命令统计信息
   * @returns 所有命令的统计信息
   */
  getAllCommandStats(): Record<string, { count: number; avgTime: number }> {
    const stats: Record<string, { count: number; avgTime: number }> = {};
    this.commandStats.forEach((value, key) => {
      stats[key] = { ...value };
    });
    return stats;
  }

  /**
   * 更新命令统计信息
   * @param command 命令名称
   * @param executionTime 执行时间
   */
  private updateCommandStats(command: string, executionTime: number): void {
    const currentStats = this.commandStats.get(command) || {
      count: 0,
      avgTime: 0,
    };
    const newCount = currentStats.count + 1;
    const newAvgTime = (currentStats.avgTime * currentStats.count + executionTime) / newCount;

    this.commandStats.set(command, {
      count: newCount,
      avgTime: Math.round(newAvgTime * 100) / 100,
    });
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.commandStats.clear();
  }
}

// 创建单例实例
const tauriOptimizer = TauriCommandOptimizer.getInstance();

// 导出全局优化器
(window as any).$tauriOptimizer = tauriOptimizer;

export default tauriOptimizer;
export { TauriCommandOptimizer };
