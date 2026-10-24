import { useEffect, useState } from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import { useInterval } from 'ahooks';
import { FaUtils } from '@fa/ui';
import type { Admin } from '@features/fa-admin-pages/types';
import { systemApi } from '@features/fa-admin-pages/services';
import MonitorCard from '../MonitorCard';
import ResourceGauge from './ResourceGauge';

export type SystemMemoryProps = {};

export function SystemMemory() {
  const [data, setData] = useState<Admin.ServerInfo>();

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(fetchData, 5000);

  function fetchData() {
    systemApi.server().then((res) => setData(res.data));
  }

  let value: number | undefined;
  let totalStr = '—';
  let usedStr = '—';
  if (data && data.memory && data.memory.total > 0) {
    const used = data.memory.total - data.memory.available;
    value = Math.round((used / data.memory.total) * 100);

    usedStr = FaUtils.sizeToHuman(used);
    totalStr = FaUtils.sizeToHuman(data.memory.total);
  }

  return (
    <MonitorCard title="内存" icon={<DatabaseOutlined />} extra="5 秒刷新">
      <ResourceGauge label="内存" value={value} />
      <div className="monitor-resource-footer">
        <span>
          已使用<b>{usedStr}</b>
        </span>
        <span>
          总容量<b>{totalStr}</b>
        </span>
      </div>
    </MonitorCard>
  );
}

SystemMemory.displayName = 'SystemMemory'; // 必须与方法名称一致
SystemMemory.title = '内存';
SystemMemory.description = '内存运行状态指标图';
SystemMemory.showTitle = false; // 组件内统一展示标题
SystemMemory.permission = ''; // 需要的权限
SystemMemory.w = 6; // 宽度-max=24
SystemMemory.h = 12; // 高度
