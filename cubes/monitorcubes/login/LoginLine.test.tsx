import { ConfigProvider, theme } from 'antd';
import { color, type EChartsOption, type LineSeriesOption } from 'echarts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LoginLine } from './LoginLine';

const { captureOption } = vi.hoisted(() => ({ captureOption: vi.fn() }));

vi.mock('@fa/ui', () => ({ FaUtils: {} }));
vi.mock('@features/fa-admin-pages/services', () => ({ logLoginApi: { countByDay: vi.fn() } }));
vi.mock('@features/fa-admin-pages/components/echarts/EchartsBase', () => ({
  default: ({ option }: { option: EChartsOption }) => {
    captureOption(option);
    return null;
  },
}));

describe('登录趋势图颜色', () => {
  it.each([false, true])('Canvas 渐变在暗色模式 %s 下只接收可解析的颜色', (dark) => {
    renderToStaticMarkup(
      <ConfigProvider
        theme={{
          algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: { colorBgContainer: dark ? 'var(--fa-bg-color)' : '#FFF' },
        }}
      >
        <LoginLine />
      </ConfigProvider>,
    );

    const option = captureOption.mock.calls.at(-1)![0] as EChartsOption;
    const series = (option.series as LineSeriesOption[])[0];
    const gradient = series.areaStyle!.color as { colorStops: { color: string }[] };

    for (const stop of gradient.colorStops) {
      expect(color.parse(stop.color), `Canvas 无法解析颜色：${stop.color}`).toBeDefined();
    }
  });
});
