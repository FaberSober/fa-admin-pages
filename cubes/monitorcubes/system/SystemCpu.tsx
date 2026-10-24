import { useEffect, useState } from 'react';
import { DashboardOutlined } from '@ant-design/icons';
import { useInterval } from 'ahooks';
import type { Admin } from '@features/fa-admin-pages/types';
import { systemApi } from '@features/fa-admin-pages/services';
import MonitorCard from '../MonitorCard';
import ResourceGauge from './ResourceGauge';

// export type SystemCpuProps = {}

export function SystemCpu() {
  const [data, setData] = useState<Admin.ServerInfo>();

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(fetchData, 5000);

  function fetchData() {
    systemApi.server().then((res) => setData(res.data));
  }

  const value = data?.cpuInfo?.used;

  return (
    <MonitorCard title="CPU" icon={<DashboardOutlined />} extra="5 秒刷新">
      <ResourceGauge label="CPU" value={value} />
      <div className="monitor-resource-footer">
        <span>
          处理器<b>{data?.cpuInfo ? `${data.cpuInfo.cpuNum} 核心` : '—'}</b>
        </span>
        <span>
          空闲率<b>{data?.cpuInfo ? `${Number(data.cpuInfo.free.toFixed(2))}%` : '—'}</b>
        </span>
      </div>
    </MonitorCard>
  );
}

SystemCpu.displayName = 'SystemCpu'; // 必须与方法名称一致
SystemCpu.title = 'CPU';
SystemCpu.description = 'CPU运行状态指标图';
SystemCpu.showTitle = false; // 组件内统一展示标题
SystemCpu.permission = ''; // 需要的权限
SystemCpu.w = 6; // 宽度-max=24
SystemCpu.h = 12; // 高度
