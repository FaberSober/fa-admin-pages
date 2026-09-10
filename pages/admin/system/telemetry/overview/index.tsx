import {
  AppstoreOutlined, BugOutlined, FileTextOutlined, ReloadOutlined, ThunderboltOutlined, UserOutlined,
} from '@ant-design/icons';
import { EchartsLine } from '@features/fa-admin-pages/components';
import { clientTypes, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { telemetryDashboardApi } from '@features/fa-admin-pages/services';
import { ThemeLayoutContext } from '@fa/ui';
import type { Admin } from '@/types';
import { Button, Card, Col, Empty, Row, Segmented, Skeleton, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import '../dashboard/index.scss';

const EMPTY_OVERVIEW: Admin.TelemetryGlobalDashboardOverview = {
  appCount: 0,
  enabledAppCount: 0,
  activeUserCount: 0,
  pageViewCount: 0,
  businessEventCount: 0,
  errorCount: 0,
};

const formatNum = (value: number) => {
  const num = Number(value);
  return Number.isFinite(num) ? num.toLocaleString('zh-CN') : '0';
};

const formatDateTime = (value?: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—';

interface MetricConfig {
  key: keyof Admin.TelemetryGlobalDashboardOverview;
  title: string;
  icon: ReactNode;
  color: string;
  gradient: string;
}

const METRICS: MetricConfig[] = [
  { key: 'appCount', title: '接入应用数', icon: <AppstoreOutlined />, color: '#1677ff', gradient: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' },
  { key: 'enabledAppCount', title: '启用应用数', icon: <AppstoreOutlined />, color: '#13c2c2', gradient: 'linear-gradient(135deg, #13c2c2 0%, #5cdbd3 100%)' },
  { key: 'activeUserCount', title: '今日全局活跃用户', icon: <UserOutlined />, color: '#722ed1', gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)' },
  { key: 'pageViewCount', title: '今日页面访问 PV', icon: <FileTextOutlined />, color: '#fa8c16', gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)' },
  { key: 'businessEventCount', title: '今日业务事件', icon: <ThunderboltOutlined />, color: '#08979c', gradient: 'linear-gradient(135deg, #08979c 0%, #5cdbd3 100%)' },
  { key: 'errorCount', title: '今日客户端异常', icon: <BugOutlined />, color: '#cf1322', gradient: 'linear-gradient(135deg, #cf1322 0%, #ff7875 100%)' },
];

const buildLineOptions = (dark: boolean): EChartsOption => ({
  color: ['#1677ff', '#13c2c2', '#fa8c16', '#cf1322'],
  legend: {
    top: 0,
    right: 8,
    itemWidth: 16,
    itemHeight: 8,
    icon: 'roundRect',
    textStyle: { fontSize: 12, color: dark ? 'rgba(255,255,255,0.65)' : '#64748b' },
  },
  grid: { left: 8, right: 12, top: 32, bottom: 4, containLabel: true },
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: any) => (typeof value === 'number' ? value.toLocaleString('zh-CN') : String(value ?? '—')),
  },
  xAxis: {
    boundaryGap: false,
    axisLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.15)' : 'rgba(148,163,184,0.35)' } },
    axisTick: { show: false },
    axisLabel: { color: dark ? 'rgba(255,255,255,0.55)' : '#94a3b8', fontSize: 11 },
  },
  yAxis: {
    splitLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.16)', type: 'dashed' } },
    axisLabel: { color: dark ? 'rgba(255,255,255,0.55)' : '#94a3b8', fontSize: 11 },
  },
});

export default function TelemetryGlobalOverview() {
  const { themeDark } = useContext(ThemeLayoutContext);
  const [days, setDays] = useState<7 | 30>(7);
  const [overview, setOverview] = useState<Admin.TelemetryGlobalDashboardOverview>();
  const [trend, setTrend] = useState<Admin.TelemetryDashboardTrend[]>([]);
  const [appRanks, setAppRanks] = useState<Admin.TelemetryGlobalDashboardAppRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>();
  const requestId = useRef(0);

  const lineOptions = useMemo(() => buildLineOptions(themeDark), [themeDark]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function fetchData() {
    const currentRequestId = ++requestId.current;
    setLoading(true);
    try {
      const [overviewRes, trendRes, appRankRes] = await Promise.all([
        telemetryDashboardApi.globalOverview(),
        telemetryDashboardApi.globalTrend(days),
        telemetryDashboardApi.globalAppRank(days),
      ]);
      if (currentRequestId !== requestId.current) return;
      setOverview(overviewRes.data);
      setTrend(trendRes.data || []);
      setAppRanks(appRankRes.data || []);
      setUpdatedAt(dayjs().format('HH:mm:ss'));
    } finally {
      if (currentRequestId === requestId.current) setLoading(false);
    }
  }

  const data = overview || EMPTY_OVERVIEW;
  const firstLoad = loading && !overview;
  const trendDates = trend.map(item => dayjs(item.statDate).format('MM-DD'));
  const columns: TableColumnsType<Admin.TelemetryGlobalDashboardAppRank> = [
    {
      title: '应用', dataIndex: 'appName', fixed: 'left', width: 220,
      render: (_, record) => <div><div>{record.appName}</div><span style={{ color: 'var(--tel-text-sub)', fontSize: 12 }}>{record.appCode}</span></div>,
    },
    { title: '客户端', dataIndex: 'clientType', width: 100, render: value => telemetryLabel(clientTypes, value) },
    { title: '状态', dataIndex: 'enabled', width: 80, render: value => <Tag color={value ? 'green' : 'default'}>{value ? '启用' : '停用'}</Tag> },
    { title: '活跃用户', dataIndex: 'activeUserCount', width: 110, align: 'right', sorter: (a, b) => a.activeUserCount - b.activeUserCount, render: value => formatNum(value) },
    { title: 'PV', dataIndex: 'pageViewCount', width: 100, align: 'right', sorter: (a, b) => a.pageViewCount - b.pageViewCount, render: value => formatNum(value) },
    { title: '业务事件', dataIndex: 'businessEventCount', width: 110, align: 'right', sorter: (a, b) => a.businessEventCount - b.businessEventCount, render: value => formatNum(value) },
    { title: '异常', dataIndex: 'errorCount', width: 90, align: 'right', sorter: (a, b) => a.errorCount - b.errorCount, render: value => formatNum(value) },
    { title: '期间最后上报', dataIndex: 'lastReportTime', width: 160, render: value => formatDateTime(value) },
  ];

  return (
    <div className="fa-full-content fa-p12 tel-dashboard">
      <div className="tel-header fa-mb12">
        <div>
          <div className="tel-title">Telemetry 全局概览</div>
          <div className="tel-subtitle">
            所有应用的整体使用情况与最近 {days} 天趋势
            {updatedAt && <span className="tel-updated">· 更新于 {updatedAt}</span>}
          </div>
        </div>
        <Space wrap>
          <Segmented<7 | 30> value={days} options={[{ label: '近 7 天', value: 7 }, { label: '近 30 天', value: 30 }]} onChange={setDays} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} className="fa-mb12">
        {METRICS.map(metric => <Metric key={metric.key} config={metric} value={data[metric.key]} loading={firstLoad} />)}
      </Row>

      <Card className="tel-card fa-mb12" title="全局使用趋势" extra={<span className="tel-card-extra">最近 {days} 天 · 跨应用去重用户</span>}>
        {loading && trend.length === 0 ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : trendDates.length === 0 ? (
          <div className="tel-chart-empty" style={{ height: 300 }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无趋势数据" /></div>
        ) : (
          <div style={{ height: 300 }}>
            <EchartsLine
              dataX={trendDates}
              dataY={[
                { name: '活跃用户', data: trend.map(item => item.activeUserCount) },
                { name: '页面访问', data: trend.map(item => item.pageViewCount) },
                { name: '业务事件', data: trend.map(item => item.businessEventCount) },
                { name: '异常', data: trend.map(item => item.errorCount) },
              ]}
              restOption={lineOptions}
            />
          </div>
        )}
      </Card>

      <Card className="tel-card" title="应用使用排行" extra={<span className="tel-card-extra">最近 {days} 天 · 按 PV 排序</span>}>
        {appRanks.length === 0 && !loading ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无应用数据" />
        ) : (
          <Table<Admin.TelemetryGlobalDashboardAppRank>
            rowKey="appId"
            size="small"
            scroll={{ x: 1050 }}
            loading={loading}
            columns={columns}
            dataSource={appRanks}
            pagination={{ pageSize: 10, hideOnSinglePage: true }}
          />
        )}
      </Card>
    </div>
  );
}

function Metric({ config, value, loading }: { config: MetricConfig; value: number; loading: boolean }) {
  return (
    <Col xs={24} sm={12} lg={8} xxl={4}>
      <Card className="tel-metric-card" styles={{ body: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' } }}>
        <div className="tel-metric-icon" style={{ background: config.gradient }}>{config.icon}</div>
        <div className="tel-metric-body">
          <div className="tel-metric-title">{config.title}</div>
          {loading ? <Skeleton.Input active size="small" style={{ width: 92, marginTop: 4 }} /> : <div className="tel-metric-value" style={{ color: config.color }}>{formatNum(value)}</div>}
        </div>
      </Card>
    </Col>
  );
}
