import { useEffect, useState } from 'react';
import { GlobalOutlined } from '@ant-design/icons';
import { theme } from 'antd';
import type { Fa } from '@/types';
import { logLoginApi } from '@features/fa-admin-pages/services';
import EchartsBase from '@features/fa-admin-pages/components/echarts/EchartsBase';
import MonitorCard from '../MonitorCard';

export type LoginAreaProps = {};

export function LoginArea() {
  const { token } = theme.useToken();
  const [array, setArray] = useState<Fa.ChartSeriesVo[]>([]);
  const total = array.reduce((sum, item) => sum + item.value, 0);
  const colors = [token.colorPrimary, '#57b8b0', '#91a7e8', '#e5ba72', '#a794c7', '#7d9ea6'];

  useEffect(() => {
    logLoginApi.countByPro().then((res) => setArray(res.data));
  }, []);

  return (
    <MonitorCard title="登录地区统计" icon={<GlobalOutlined />} extra={`${array.filter((item) => item.value > 0).length} 个地区`}>
      <div className="monitor-chart">
        <EchartsBase
          option={{
            color: colors,
            tooltip: { trigger: 'item', confine: true },
            series: [
              {
                name: '登录地区',
                type: 'pie',
                radius: ['66%', '84%'],
                center: ['50%', '50%'],
                label: { show: false },
                labelLine: { show: false },
                padAngle: 3,
                itemStyle: { borderRadius: 4 },
                emptyCircleStyle: { color: token.colorFillTertiary },
                data: total > 0 ? array : [],
              },
            ],
          }}
        />
        <div className="monitor-ring-summary">
          <strong>{total > 0 ? total.toLocaleString() : '—'}</strong>
          <span>{total > 0 ? '累计登录' : '暂无登录数据'}</span>
        </div>
      </div>
      <div className="monitor-region-legend">
        {array.map((item, index) => (
          <div key={item.name} className="monitor-region-item" title={`${item.name}：${item.value}`}>
            <i style={{ background: colors[index % colors.length] }} />
            <span>{item.name}</span>
            <b>{item.value.toLocaleString()}</b>
          </div>
        ))}
      </div>
    </MonitorCard>
  );
}

LoginArea.displayName = 'LoginArea'; // 必须与方法名称一致
LoginArea.title = '登录地区统计';
LoginArea.description = '登录地区统计柱饼图';
LoginArea.showTitle = false; // 组件内统一展示标题
LoginArea.permission = ''; // 需要的权限
LoginArea.w = 6; // 宽度-max=24
LoginArea.h = 12; // 高度
