import { describe, expect, it } from 'vitest';
import {
  formatJobAverage,
  formatJobCount,
  formatJobDuration,
  formatJobTotalDuration,
  getJobExecutionPresentation,
} from './jobStatistics';

describe('定时任务统计展示', () => {
  it('区分无值、真实零值及不安全的数字输入', () => {
    expect(formatJobDuration(null)).toBe('—');
    expect(formatJobDuration(undefined)).toBe('—');
    expect(formatJobDuration('0')).toBe('0 ms');
    expect(formatJobCount(0)).toBe('0');
    expect(formatJobDuration('')).toBe('—');
    expect(formatJobDuration('-1')).toBe('—');
    expect(formatJobCount(Number.MAX_SAFE_INTEGER + 1)).toBe('—');
  });

  it('按毫秒、秒和分秒展示并保留有效小数', () => {
    expect(formatJobDuration('350')).toBe('350 ms');
    expect(formatJobDuration('1001')).toBe('1.001 秒');
    expect(formatJobDuration('2400')).toBe('2.4 秒');
    expect(formatJobDuration('60000')).toBe('1 分');
    expect(formatJobDuration('72250')).toBe('1 分 12.25 秒');
  });

  it('Long 计数与耗时不先转成会丢失精度的 Number', () => {
    expect(formatJobCount('9223372036854775807')).toBe('9,223,372,036,854,775,807');
    expect(formatJobDuration('9223372036854775807')).toBe('153722867280912 分 55.807 秒');
  });

  it('平均值使用服务端结果且必须存在新口径样本', () => {
    expect(formatJobAverage('0', '1')).toBe('0 ms');
    expect(formatJobAverage('2400', '0')).toBe('—');
    expect(formatJobAverage('2400', null)).toBe('—');
    expect(formatJobAverage('2400', '2')).toBe('2.4 秒');
  });

  it('仅展示完整跟踪且已结束的总耗时，不把旧秒数据补成新值', () => {
    expect(formatJobTotalDuration('0', 2, 1)).toBe('0 ms');
    expect(formatJobTotalDuration('1000', 9, 1)).toBe('1 秒');
    expect(formatJobTotalDuration('1000', 1, 1)).toBe('—');
    expect(formatJobTotalDuration('1000', 2, 0)).toBe('—');
    expect(formatJobTotalDuration('1000', 8, 2)).toBe('—');
  });

  it('历史结果标旧口径，未完整跟踪不显示业务成功', () => {
    expect(getJobExecutionPresentation(null).text).toBe('—');
    expect(getJobExecutionPresentation(2, 0)).toMatchObject({ text: '成功', legacy: true });
    expect(getJobExecutionPresentation(1, 1)).toMatchObject({ text: '执行中', legacy: false });
    expect(getJobExecutionPresentation(9, 1)).toMatchObject({ text: '失败', legacy: false });
    expect(getJobExecutionPresentation(8, 2)).toMatchObject({ text: '未确认', color: 'warning', legacy: false });
    expect(getJobExecutionPresentation(2, 2).text).toBe('未确认');
    expect(getJobExecutionPresentation(2, 99).text).toBe('未确认');
  });
});
