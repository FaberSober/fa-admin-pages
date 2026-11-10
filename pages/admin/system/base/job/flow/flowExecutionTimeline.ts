import type { Admin } from '@/types';

export const executionStates: Record<number, string> = { 0: '等待执行', 10: '待调度', 20: '启动中', 30: '执行中', 40: '成功', 50: '失败', 60: '已阻断', 70: '已停止', 80: '未确认' };
const terminal = new Set([40, 50, 70]);

/** 校验日历时间后解析，避免 Date 将无效日期自动归一化。无时区时间沿用页面本地时间。 */
export function parseExecutionTime(value?: string): number | undefined {
  if (!value) return undefined;
  const parts = /^(\d{4})-(\d{2})-(\d{2})([ T])(\d{2}):(\d{2}):(\d{2})(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!parts) return undefined;
  const [, y, m, d, separator, h, minute, second, fraction, zone] = parts;
  if (separator === ' ' && zone) return undefined;
  const [year, month, day, hour, min, sec] = [y, m, d, h, minute, second].map(Number);
  if (year < 1000 || month < 1 || month > 12 || day < 1 || hour > 23 || min > 59 || sec > 59) return undefined;
  const calendar = new Date(Date.UTC(year, month - 1, day));
  if (calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day) return undefined;
  const timestamp = zone ? Date.parse(value) : new Date(year, month - 1, day, hour, min, sec, Math.round(Number(fraction ?? 0) * 1000)).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

export function getNodeDurationMs(node: Admin.JobFlowNodeRun): number | undefined {
  if (!terminal.has(node.status)) return undefined;
  const begin = parseExecutionTime(node.beginTime), end = parseExecutionTime(node.endTime);
  return begin !== undefined && end !== undefined && end >= begin ? end - begin : undefined;
}
export interface ExecutionEvent { key: string; node: Admin.JobFlowNodeRun; kind: 'begin' | 'end'; timestamp: number; time: string; order: number }

/** 从持久记录派生展示，不推测缺失的终态或结束时间。 */
export function buildExecutionTimeline(nodes: Admin.JobFlowNodeRun[]) {
  const events: ExecutionEvent[] = [];
  const undated: Admin.JobFlowNodeRun[] = [];
  nodes.slice(0, 100).forEach((node, order) => {
    const begin = parseExecutionTime(node.beginTime), end = parseExecutionTime(node.endTime);
    let recorded = false;
    if (begin !== undefined) {
      events.push({ key: `${node.id}:begin`, node, kind: 'begin', timestamp: begin, time: node.beginTime!, order: order * 2 }); recorded = true;
    }
    if (terminal.has(node.status) && end !== undefined && (begin === undefined || end >= begin)) {
      events.push({ key: `${node.id}:end`, node, kind: 'end', timestamp: end, time: node.endTime!, order: order * 2 + 1 }); recorded = true;
    }
    if (!recorded) undated.push(node);
  });
  events.sort((a, b) => a.timestamp - b.timestamp || a.order - b.order);
  return { events, undated };
}

/** 一个节点一个切片；未知结束时间只展示起点，不延长成虚构的完成区间。 */
export function buildExecutionSlices(nodes: Admin.JobFlowNodeRun[]) {
  const slices = nodes.slice(0, 100).map((node, index) => ({ node, index, begin: parseExecutionTime(node.beginTime), duration: getNodeDurationMs(node) }));
  const times = slices.flatMap(slice => slice.begin === undefined ? [] : [slice.begin, slice.begin + (slice.duration ?? 0)]);
  const origin = times.length ? Math.min(...times) : 0;
  const span = Math.max(1, times.length ? Math.max(...times) - origin : 1);
  return slices.sort((a, b) => (a.begin ?? Number.POSITIVE_INFINITY) - (b.begin ?? Number.POSITIVE_INFINITY) || a.index - b.index)
    .map(slice => ({ ...slice, offset: slice.begin === undefined ? undefined : (slice.begin - origin) / span * 100, width: slice.duration === undefined ? undefined : slice.duration / span * 100 }));
}

/** 展示本轮可确认的日期范围，不为缺失时间补造日期。 */
export function executionDateRange(run: { log: Pick<Admin.JobLog, 'beginTime' | 'endTime'>; nodes: Admin.JobFlowNodeRun[] }) {
  const values = [run.log.beginTime, run.log.endTime, ...run.nodes.flatMap(node => [node.beginTime, node.endTime])];
  const dates = values.filter(value => parseExecutionTime(value) !== undefined).map(value => value!.slice(0, 10)).sort();
  if (!dates.length) return '日期未记录';
  return dates[0] === dates[dates.length - 1] ? dates[0] : `${dates[0]} ～ ${dates[dates.length - 1]}`;
}
