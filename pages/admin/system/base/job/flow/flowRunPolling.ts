import type { Admin } from '@/types';

/** 单请求链；终态、异常或关闭后停止，取消未完成请求。 */
export function startFlowRunPolling({
  read,
  onResult,
  onError,
}: {
  read: (signal: AbortSignal) => Promise<Admin.JobFlowRun>;
  onResult: (result: Admin.JobFlowRun) => void;
  onError: () => void;
}) {
  const controller = new AbortController();
  let active = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const poll = async () => {
    try {
      const result = await read(controller.signal);
      if (!active) return;
      onResult(result);
      if ((result.log.status === 1 || result.log.status === 3)) timer = setTimeout(poll, 2000);
    } catch {
      if (active && !controller.signal.aborted) onError();
    }
  };
  void poll();
  return () => {
    active = false;
    controller.abort();
    clearTimeout(timer);
  };
}
