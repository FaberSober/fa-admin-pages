import { useEffect, useState } from 'react';
import { HddOutlined } from '@ant-design/icons';
import { useInterval } from 'ahooks';
import type { Admin } from '@/types';
import { systemApi } from '@features/fa-admin-pages/services';
import { FaUtils } from '@fa/ui';
import MonitorCard from '../MonitorCard';

export type SystemDiskProps = {};

export function SystemDisk() {
  const [data, setData] = useState<Admin.ServerInfo>();

  useEffect(() => {
    fetchData();
  }, []);

  useInterval(fetchData, 5000);

  function fetchData() {
    systemApi.server().then((res) => setData(res.data));
  }

  return (
    <MonitorCard title="磁盘" icon={<HddOutlined />} extra="容量概览">
      <div className="monitor-disk-list">
        {data?.fileStoreList.map((i) => {
          const usedPercent = i.totalSpace > 0 ? Math.min(100, Math.max(0, (1 - i.freeSpace / i.totalSpace) * 100)) : 0;
          const color = usedPercent >= 85 ? 'var(--monitor-error)' : usedPercent >= 70 ? 'var(--monitor-warning)' : 'var(--monitor-accent)';
          return (
            <div key={i.uuid} className="monitor-disk-item">
              <div className="monitor-disk-heading">
                <HddOutlined style={{ color: 'var(--monitor-muted)' }} />
                <strong title={`${i.name}\n${i.volume}`}>{i.name || i.volume}</strong>
                <span style={{ color }}>{usedPercent.toFixed(0)}%</span>
              </div>
              <div
                className="monitor-disk-track"
                role="progressbar"
                aria-label={`${i.name || i.volume}已用容量`}
                aria-valuenow={Math.round(usedPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ width: `${usedPercent}%`, background: color }} />
              </div>
              <div className="monitor-disk-caption">
                <span>可用 {FaUtils.sizeToHuman(i.freeSpace, 1)}</span>
                <span>共 {FaUtils.sizeToHuman(i.totalSpace, 1)}</span>
              </div>
            </div>
          );
        })}
        {!data?.fileStoreList.length && <div className="monitor-empty">暂无磁盘数据</div>}
      </div>
    </MonitorCard>
  );
}

SystemDisk.displayName = 'SystemDisk'; // 必须与方法名称一致
SystemDisk.title = '磁盘';
SystemDisk.description = '磁盘运行状态指标图';
SystemDisk.showTitle = false; // 组件内统一展示标题
SystemDisk.permission = ''; // 需要的权限
SystemDisk.w = 6; // 宽度-max=24
SystemDisk.h = 12; // 高度
