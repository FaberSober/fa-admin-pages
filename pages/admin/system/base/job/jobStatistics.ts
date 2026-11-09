/** 后端 Long 使用字符串传输，格式化时保留完整整数精度。 */
type LongValue = string | number | bigint | null | undefined;

export function parseJobLong(value: LongValue): bigint | undefined {
  if (typeof value === 'bigint') return value >= 0n ? value : undefined;
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : undefined;
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return undefined;
  return BigInt(value.trim());
}

export function formatJobCount(value: LongValue) {
  return parseJobLong(value)?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '—';
}

function formatSeconds(value: bigint) {
  const fraction = (value % 1000n).toString().padStart(3, '0').replace(/0+$/, '');
  return `${value / 1000n}${fraction ? `.${fraction}` : ''}`;
}

export function formatJobDuration(value: LongValue) {
  const millis = parseJobLong(value);
  if (millis === undefined) return '—';
  if (millis < 1000n) return `${millis} ms`;
  if (millis < 60_000n) return `${formatSeconds(millis)} 秒`;
  const minutes = millis / 60_000n;
  const remaining = millis % 60_000n;
  return remaining === 0n ? `${minutes} 分` : `${minutes} 分 ${formatSeconds(remaining)} 秒`;
}

/** 无样本时不展示 0，旧记录与未确认执行不能混入平均总耗时。 */
export function formatJobAverage(duration: LongValue, sampleCount: LongValue) {
  const samples = parseJobLong(sampleCount);
  return samples !== undefined && samples > 0n ? formatJobDuration(duration) : '—';
}

export function formatJobTotalDuration(duration: LongValue, status?: number | null, trackingVersion?: number | null) {
  return trackingVersion === 1 && (status === 2 || status === 7 || status === 9) ? formatJobDuration(duration) : '—';
}

export function getJobExecutionPresentation(status?: number | null, trackingVersion?: number | null) {
  if (status == null) return { text: '—', color: undefined, legacy: false, notice: undefined };
  if (status === 8 || trackingVersion === 2 || (trackingVersion != null && trackingVersion !== 0 && trackingVersion !== 1)) {
    return {
      text: '未确认', color: 'warning', legacy: false,
      notice: '本轮存在无法确认是否完成的异步工作，不计入成功、失败次数和平均总耗时。',
    };
  }
  const states: Record<number, { text: string; color?: string }> = {
    1: { text: '执行中', color: 'processing' },
    3: { text: '停止中', color: 'processing' },
    7: { text: '已停止', color: 'default' },
    2: { text: '成功', color: 'success' },
    9: { text: '失败', color: 'error' },
  };
  const legacy = trackingVersion == null || trackingVersion === 0;
  return {
    ...(states[status] ?? { text: '未知状态', color: undefined }),
    legacy,
    notice: legacy ? '历史记录：结束时间和结果可能只表示任务入口已返回，无法确认异步业务是否完成，因此不参与平均总耗时。' : undefined,
  };
}
