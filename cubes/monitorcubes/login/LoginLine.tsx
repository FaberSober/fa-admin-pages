import { useEffect, useState } from 'react';
import { LineChartOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import type { Fa } from '@/types';
import { FaUtils } from '@fa/ui';
import dayjs from 'dayjs';
import EchartsBase from '@features/fa-admin-pages/components/echarts/EchartsBase';
import { logLoginApi } from '@features/fa-admin-pages/services';
import MonitorCard from '../MonitorCard';

export type LoginLineProps = {};

export function LoginLine() {
  const { token } = theme.useToken();
  const [array, setArray] = useState<Fa.ChartSeriesVo[]>([]);
  const total = array.reduce((sum, item) => sum + item.value, 0);

  useEffect(() => {
    logLoginApi
      .countByDay({
        startDate: FaUtils.getDateStrBeginOfDay(dayjs().add(-10, 'day'))!,
        endDate: FaUtils.getDateStrEndOfDay(dayjs())!,
      })
      .then((res) => setArray(res.data));
  }, []);

  return (
    <MonitorCard title="每日登录统计" icon={<LineChartOutlined />} extra="近 11 天">
      <div className="monitor-trend-summary">
        <strong>{total.toLocaleString()}</strong>
        <span>次登录</span>
      </div>
      <div className="monitor-chart">
        <EchartsBase
          option={{
            color: [token.colorPrimary],
            grid: { left: 4, right: 12, top: 16, bottom: 4, containLabel: true },
            tooltip: { trigger: 'axis', confine: true, axisPointer: { type: 'line' }, valueFormatter: (value) => `${value} 次` },
            xAxis: {
              type: 'category',
              boundaryGap: false,
              data: array.map((item) => item.name),
              axisLine: { show: false },
              axisTick: { show: false },
              axisLabel: {
                color: token.colorTextSecondary,
                fontSize: 11,
                margin: 12,
                hideOverlap: true,
                formatter: (value: string) => dayjs(value).format('MM-DD'),
              },
            },
            yAxis: {
              type: 'value',
              min: 0,
              minInterval: 1,
              axisLabel: { color: token.colorTextSecondary, fontSize: 11 },
              splitLine: { lineStyle: { color: token.colorBorderSecondary, type: 'dashed' } },
            },
            series: [
              {
                name: '登录用户数',
                type: 'line',
                smooth: 0.25,
                smoothMonotone: 'x',
                data: array.map((item) => item.value),
                symbol: 'circle',
                symbolSize: 6,
                showSymbol: false,
                lineStyle: { width: 2.5 },
                areaStyle: {
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: token.colorPrimaryBgHover },
                      // Canvas 不支持 CSS 变量，使用透明色淡出到卡片背景。
                      { offset: 1, color: 'rgba(0, 0, 0, 0)' },
                    ],
                  },
                  opacity: 0.6,
                },
              },
            ],
          }}
        />
      </div>
    </MonitorCard>
  );
}

LoginLine.displayName = 'LoginLine'; // 必须与方法名称一致
LoginLine.title = '每日登录统计';
LoginLine.description = '每日登录统计折线图';
LoginLine.showTitle = false; // 组件内统一展示标题
LoginLine.permission = ''; // 需要的权限
LoginLine.w = 18; // 宽度-max=24
LoginLine.h = 12; // 高度
