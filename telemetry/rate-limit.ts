/**
 * Telemetry 异常上报限流。
 *
 * 背景：前端异常可能由高频事件触发（如 mousemove + requestAnimationFrame 每帧抛错），
 * 若不限流，同一异常会在极短时间内打爆 `/api/base/telemetry/open/error` 上报接口。
 * 此处做双层防护：
 * 1. 同指纹冷却：相同异常（errorType + 归一化 message + 首个堆栈函数名）在冷却期内只发第 1 条；
 * 2. 全局滑动窗口上限：任意异常合计每分钟最多 ERROR_MAX_PER_WINDOW 条，作为整体兜底。
 */

/** 同一错误指纹的冷却时间（毫秒） */
export const ERROR_COOLDOWN_MS = 30_000;
/** 全局限流滑动窗口长度（毫秒） */
export const ERROR_WINDOW_MS = 60_000;
/** 全局窗口内允许上报的最大条数 */
export const ERROR_MAX_PER_WINDOW = 30;

/**
 * 归一化错误指纹：errorType + message + 首个堆栈函数名。
 * 与后端 Issue 聚合口径（应用 + 客户端类型 + 异常类型 + 归一化消息 + 顶部堆栈帧）对齐，
 * 只取稳定的函数名，不包含文件路径 / 构建版本号（如 klinecharts.js?v=xxx 中的 hash）。
 */
export function getErrorFingerprint(errorType: string, message: string, stack?: string): string {
  const firstFrame = parseFirstStackFrame(stack);
  return `${errorType}|${message}|${firstFrame}`;
}

/** 从堆栈中解析首个可归一的函数名；解析失败返回空串（此时指纹退化为 errorType + message）。 */
function parseFirstStackFrame(stack?: string): string {
  if (!stack) return '';
  // V8 格式：Error: msg\n    at fnName (file:line:col)\n...
  // Firefox 格式：fnName@file:line:col
  const line = stack.split('\n').find((l) => l.includes('at ') || l.includes('@'));
  if (!line) return '';
  // 兼容 "at async fnName" 等异步帧
  const atMatch = line.match(/at\s+(?:async\s+)?([^\s(]+)/);
  if (atMatch) return atMatch[1];
  const ffMatch = line.match(/^([^\s@]+)@/);
  return ffMatch ? ffMatch[1] : '';
}

/** 异常上报限流器：同指纹冷却 + 全局滑动窗口上限。 */
export class TelemetryErrorRateLimiter {
  /** 各指纹最近一次实际发送时间（毫秒） */
  private readonly lastSentAt = new Map<string, number>();
  /** 全局滑动窗口内已发送时间戳（毫秒），按时间升序 */
  private readonly sentTimes: number[] = [];

  /**
   * 是否放行本次上报；放行后记录发送时间，被抑制的上报不占用冷却与窗口额度。
   */
  shouldSend(fingerprint: string, now = Date.now()): boolean {
    // 1. 同指纹冷却
    const last = this.lastSentAt.get(fingerprint);
    if (last !== undefined && now - last < ERROR_COOLDOWN_MS) {
      return false;
    }
    // 2. 清理已滑出窗口的发送记录
    while (this.sentTimes.length > 0 && now - this.sentTimes[0] >= ERROR_WINDOW_MS) {
      this.sentTimes.shift();
    }
    // 3. 全局滑动窗口上限
    if (this.sentTimes.length >= ERROR_MAX_PER_WINDOW) {
      return false;
    }
    // 4. 放行并记录
    this.sentTimes.push(now);
    this.lastSentAt.set(fingerprint, now);
    return true;
  }
}
