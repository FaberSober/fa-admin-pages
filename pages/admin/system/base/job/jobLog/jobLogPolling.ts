import type { Admin } from '@features/fa-admin-pages/types';

interface PollingOptions {
  read: (offset: string, signal: AbortSignal) => Promise<Admin.JobLogRead>;
  onChunk: (chunk: Admin.JobLogRead) => void;
  onError: (error: unknown) => void;
}

export const MAX_VISIBLE_LOG_CHARS = 2_000_000;

export function appendVisibleLog(previous: string, content: string) {
  const text = previous + content;
  let visible = text.slice(-MAX_VISIBLE_LOG_CHARS);
  // 有界显示缓冲也不能从 UTF-16 代理对中间开始。
  if (visible.charCodeAt(0) >= 0xdc00 && visible.charCodeAt(0) <= 0xdfff) visible = visible.slice(1);
  return { content: visible, trimmed: text.length > MAX_VISIBLE_LOG_CHARS };
}

export function isLogReadComplete(chunk: Admin.JobLogRead) {
  return !chunk.available || ((chunk.status === 2 || chunk.status === 8 || chunk.status === 9) && !chunk.hasMore);
}

/** 单个顺序请求链；结束后补齐 EOF，销毁后忽略迟到响应。 */
export function startJobLogPolling({ read, onChunk, onError }: PollingOptions) {
  const controller = new AbortController();
  let active = true;
  let offset = '0';
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function poll() {
    try {
      const chunk = await read(offset, controller.signal);
      if (!active) return;
      onChunk(chunk);
      if (isLogReadComplete(chunk)) return;
      const advanced = offset !== chunk.nextOffset;
      offset = chunk.nextOffset;
      // 有积压时立即补齐；写入中的不完整字符不得造成空转请求。
      timer = setTimeout(poll, chunk.hasMore && advanced ? 0 : 2000);
    } catch (error) {
      if (active && !controller.signal.aborted) onError(error);
    }
  }

  void poll();
  return () => {
    active = false;
    controller.abort();
    clearTimeout(timer);
  };
}
