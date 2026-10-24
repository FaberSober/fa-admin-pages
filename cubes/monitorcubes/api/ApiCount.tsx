import { useEffect, useState } from 'react';
import { ApiOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { logApiApi, jobLogApi } from '@features/fa-admin-pages/services';
import dayjs from 'dayjs';
import { FaUtils } from '@fa/ui';
import { useInterval } from 'ahooks';
import MonitorCard from '../MonitorCard';

export type ApiCountProps = {};

export function ApiCount() {
  const [apiCount, setApiCount] = useState<number>(0);
  const [apiErrorCount, setApiErrorCount] = useState<number>(0);
  const [jobApiErrorCount, setJobApiErrorCount] = useState<number>(0);

  function refresh() {
    const dayStart = FaUtils.getDateStrBeginOfDay(dayjs());
    const dayEnd = FaUtils.getDateStrEndOfDay(dayjs());

    // 今日API访问数
    logApiApi
      .count({
        query: {
          'crtTime#$min': dayStart,
          'crtTime#$max': dayEnd,
        },
      })
      .then((res) => setApiCount(res.data));

    // 今日API异常数
    logApiApi
      .count({
        query: {
          'crtTime#$min': dayStart,
          'crtTime#$max': dayEnd,
          'retStatus#$notIn': [200, 401],
        },
      })
      .then((res) => setApiErrorCount(res.data));

    // 定时任务异常数
    jobLogApi
      .count({
        query: {
          'beginTime#$min': dayStart,
          'beginTime#$max': dayEnd,
          status: 9,
        },
      })
      .then((res) => setJobApiErrorCount(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  useInterval(refresh, 60 * 1000);

  return (
    <MonitorCard title="API 统计" icon={<ApiOutlined />} extra="今日">
      <div className="monitor-api">
        <div className="monitor-api-total">
          <span className="monitor-api-total-label">API 访问总数</span>
          <strong>
            {apiCount.toLocaleString()}
            <small>次</small>
          </strong>
          <span className="monitor-api-total-caption">
            <ClockCircleOutlined />
            每分钟自动更新
          </span>
          <ApiOutlined className="monitor-api-watermark" aria-hidden="true" />
        </div>
        <div className="monitor-api-metrics">
          <div className={`monitor-api-metric${apiErrorCount > 0 ? ' is-error' : ''}`}>
            <div className="monitor-api-metric-label">
              <WarningOutlined />
              API 异常
            </div>
            <strong>{apiErrorCount.toLocaleString()}</strong>
            <span className="monitor-api-metric-status">{apiErrorCount > 0 ? '需关注' : '无异常'}</span>
          </div>
          <div className={`monitor-api-metric${jobApiErrorCount > 0 ? ' is-error' : ''}`}>
            <div className="monitor-api-metric-label">
              <ClockCircleOutlined />
              定时任务异常
            </div>
            <strong>{jobApiErrorCount.toLocaleString()}</strong>
            <span className="monitor-api-metric-status">{jobApiErrorCount > 0 ? '需关注' : '无异常'}</span>
          </div>
        </div>
      </div>
    </MonitorCard>
  );
}

ApiCount.displayName = 'ApiCount'; // 必须与方法名称一致
ApiCount.title = 'API统计';
ApiCount.description = 'API访问数量统计';
ApiCount.showTitle = false; // 组件内统一展示标题
ApiCount.permission = ''; // 需要的权限
ApiCount.w = 6; // 宽度-max=24
ApiCount.h = 12; // 高度
