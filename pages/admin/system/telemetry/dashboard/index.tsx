import {
  BarChartOutlined, BugOutlined, DashboardOutlined, DatabaseOutlined, FileTextOutlined,
  LineChartOutlined, LoginOutlined, ReloadOutlined, TeamOutlined, ThunderboltOutlined, UserOutlined,
} from '@ant-design/icons';
import { EchartsBar, EchartsLine } from '@features/fa-admin-pages/components';
import { telemetryDashboardApi } from '@features/fa-admin-pages/services';
import { ThemeLayoutContext } from '@fa/ui';
import type { Admin, Fa } from '@/types';
import { Button, Card, Col, Empty, Row, Segmented, Skeleton, Space } from 'antd';
import type { BarSeriesOption, EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import './index.scss';

const EMPTY_OVERVIEW: Admin.TelemetryDashboardOverview = {
  activeUserCount: 0,
  loginUserCount: 0,
  pageViewCount: 0,
  businessEventCount: 0,
  errorCount: 0,
  affectedUserCount: 0,
};

const formatNum = (n: number) => {
  const num = Number(n);
  return Number.isFinite(num) ? num.toLocaleString('zh-CN') : '0';
};

interface MetricConfig {
  key: keyof Admin.TelemetryDashboardOverview;
  title: string;
  icon: ReactNode;
  color: string;
  gradient: string;
}

const METRICS: MetricConfig[] = [
  { key: 'activeUserCount', title: '今日活跃用户', icon: <UserOutlined />, color: '#1677ff', gradient: 'linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)' },
  { key: 'loginUserCount', title: '今日登录用户', icon: <LoginOutlined />, color: '#13c2c2', gradient: 'linear-gradient(135deg, #13c2c2 0%, #5cdbd3 100%)' },
  { key: 'pageViewCount', title: '页面访问 PV', icon: <FileTextOutlined />, color: '#722ed1', gradient: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)' },
  { key: 'businessEventCount', title: '业务操作', icon: <ThunderboltOutlined />, color: '#fa8c16', gradient: 'linear-gradient(135deg, #fa8c16 0%, #ffc069 100%)' },
  { key: 'errorCount', title: '客户端异常', icon: <BugOutlined />, color: '#cf1322', gradient: 'linear-gradient(135deg, #cf1322 0%, #ff7875 100%)' },
  { key: 'affectedUserCount', title: '受影响用户', icon: <TeamOutlined />, color: '#d48806', gradient: 'linear-gradient(135deg, #d48806 0%, #ffd666 100%)' },
];

const SCOPE_ITEMS = [
  { icon: <DashboardOutlined />, color: '#1677ff', bg: 'rgba(22,119,255,0.12)', title: '今日实时指标', desc: '直接读取 Stat Event，实时统计今日活跃 / 登录 / PV / 业务与异常' },
  { icon: <LineChartOutlined />, color: '#13c2c2', bg: 'rgba(19,194,194,0.12)', title: '历史使用趋势', desc: '按日聚合近 7 / 30 天窗口的活跃、登录、业务操作与异常' },
  { icon: <BarChartOutlined />, color: '#fa8c16', bg: 'rgba(250,140,22,0.12)', title: '业务使用排行', desc: '统计近 30 天各模块与各功能的使用次数排行' },
  { icon: <DatabaseOutlined />, color: '#722ed1', bg: 'rgba(114,46,209,0.12)', title: '数据留存策略', desc: '每日汇总任务保留长期聚合数据，页面以有限原始事件窗口保证计算准确性' },
];

/** 柱状图配色：第 1 名主色高亮，其余递减 */
const barPalette = (base: string) => (params: any) => {
  const list = [base, `${base}66`, `${base}33`, 'rgba(148,163,184,0.45)'];
  return list[Math.min(params.dataIndex, list.length - 1)];
};

const chartTooltip = {
  backgroundColor: 'rgba(15,23,42,0.88)',
  borderWidth: 0,
  padding: [8, 12],
  textStyle: { color: '#fff', fontSize: 12 },
};

/** 折线图配置：坐标轴 / 图例 / 网格线随明暗主题切换 */
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
    ...chartTooltip,
    axisPointer: { type: 'line', lineStyle: { color: dark ? 'rgba(255,255,255,0.3)' : 'rgba(148,163,184,0.5)', type: 'dashed' } },
    valueFormatter: (value: any) => (typeof value === 'number' ? value.toLocaleString('zh-CN') : String(value ?? '-')),
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
  series: [
    {
      name: '活跃用户',
      type: 'line',
      smooth: true,
      showSymbol: false,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2.5 },
      emphasis: { focus: 'series' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(22,119,255,0.18)' },
            { offset: 1, color: 'rgba(22,119,255,0)' },
          ],
        },
      },
    },
    { name: '登录次数', type: 'line', smooth: true, showSymbol: false, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2 }, emphasis: { focus: 'series' } },
    { name: '业务操作', type: 'line', smooth: true, showSymbol: false, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2 }, emphasis: { focus: 'series' } },
    { name: '异常', type: 'line', smooth: true, showSymbol: false, symbol: 'circle', symbolSize: 7, lineStyle: { width: 2, type: 'dashed' }, emphasis: { focus: 'series' } },
  ],
});

/** 柱状图配置：坐标轴 / 网格线随明暗主题切换 */
const buildBarOptions = (dark: boolean): EChartsOption => ({
  legend: { show: false },
  grid: { left: 8, right: 16, top: 12, bottom: 4, containLabel: true },
  xAxis: {
    axisLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.15)' : 'rgba(148,163,184,0.35)' } },
    axisTick: { show: false },
    axisLabel: { color: dark ? 'rgba(255,255,255,0.55)' : '#94a3b8', fontSize: 11, interval: 0, formatter: (v: string) => (v.length > 12 ? `${v.slice(0, 12)}…` : v) },
  },
  yAxis: {
    splitLine: { lineStyle: { color: dark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.16)', type: 'dashed' } },
    axisLabel: { color: dark ? 'rgba(255,255,255,0.55)' : '#94a3b8', fontSize: 11 },
  },
  tooltip: { ...chartTooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
});

const MODULE_BAR_SERIES: BarSeriesOption = {
  itemStyle: {
    borderRadius: [6, 6, 0, 0],
    color: barPalette('#722ed1'),
  },
  tooltip: {
    valueFormatter: (value: any) => (typeof value === 'number' ? value.toLocaleString('zh-CN') : String(value ?? '-')),
  },
};

const EVENT_BAR_SERIES: BarSeriesOption = {
  ...MODULE_BAR_SERIES,
  itemStyle: {
    borderRadius: [6, 6, 0, 0],
    color: barPalette('#fa8c16'),
  },
};

export default function TelemetryDashboard() {
  const { themeDark } = useContext(ThemeLayoutContext);
  const [days, setDays] = useState<7 | 30>(7);
  const [overview, setOverview] = useState<Admin.TelemetryDashboardOverview>();
  const [trend, setTrend] = useState<Admin.TelemetryDashboardTrend[]>([]);
  const [moduleRank, setModuleRank] = useState<Admin.TelemetryDashboardRank[]>([]);
  const [eventRank, setEventRank] = useState<Admin.TelemetryDashboardRank[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string>();

  const lineOptions = useMemo(() => buildLineOptions(themeDark), [themeDark]);
  const barOptions = useMemo(() => buildBarOptions(themeDark), [themeDark]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  async function fetchData() {
    setLoading(true);
    try {
      const [overviewRes, trendRes, moduleRes, eventRes] = await Promise.all([
        telemetryDashboardApi.overview(),
        telemetryDashboardApi.trend(days),
        telemetryDashboardApi.moduleRank(),
        telemetryDashboardApi.eventRank(),
      ]);
      setOverview(overviewRes.data);
      setTrend(trendRes.data || []);
      setModuleRank(moduleRes.data || []);
      setEventRank(eventRes.data || []);
      setUpdatedAt(dayjs().format('HH:mm:ss'));
    } finally {
      setLoading(false);
    }
  }

  const data = overview || EMPTY_OVERVIEW;
  const firstLoad = loading && !overview;
  const trendDates = trend.map((item) => dayjs(item.statDate).format('MM-DD'));
  const moduleData: Fa.ChartArrayData[] = moduleRank.map((item) => ({ name: item.name, value: item.primaryCount }));
  const eventData: Fa.ChartArrayData[] = eventRank.map((item) => ({ name: item.name, value: item.primaryCount }));

  return (
    <div className="fa-full-content fa-p12 tel-dashboard">
      <div className="tel-header fa-mb12">
        <div>
          <div className="tel-title">Telemetry 概览</div>
          <div className="tel-subtitle">
            今日实时指标与最近 {days} 天使用趋势
            {updatedAt && <span className="tel-updated">· 更新于 {updatedAt}</span>}
          </div>
        </div>
        <Space wrap>
          <Segmented<7 | 30> value={days} options={[{ label: '近 7 天', value: 7 }, { label: '近 30 天', value: 30 }]} onChange={setDays} />
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[12, 12]} className="fa-mb12">
        {METRICS.map((m) => (
          <Metric key={m.key} config={m} value={data[m.key]} loading={firstLoad} />
        ))}
      </Row>

      <Row gutter={[12, 12]} className="fa-mb12">
        <Col xs={24} xl={16}>
          <Card className="tel-card" title="使用与异常趋势" extra={<span className="tel-card-extra">最近 {days} 天 · 按日聚合</span>} style={{ height: 350, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 12, flex: 1, minHeight: 0 } }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 8 }} />
            ) : trendDates.length === 0 ? (
              <div className="tel-chart-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无趋势数据" />
              </div>
            ) : (
              <EchartsLine
                dataX={trendDates}
                dataY={[
                  { name: '活跃用户', data: trend.map((item) => item.activeUserCount) },
                  { name: '登录次数', data: trend.map((item) => item.loginCount) },
                  { name: '业务操作', data: trend.map((item) => item.businessEventCount) },
                  { name: '异常', data: trend.map((item) => item.errorCount) },
                ]}
                restOption={lineOptions}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card title="当前统计口径" className="tel-card" style={{ height: 350, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 16, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 8 }} />
            ) : (
              <div className="tel-scope-grid">
                {SCOPE_ITEMS.map((item) => (
                  <div className="tel-scope-item" key={item.title}>
                    <div className="tel-scope-icon" style={{ color: item.color, background: item.bg }}>{item.icon}</div>
                    <div className="tel-scope-body">
                      <div className="tel-scope-title">{item.title}</div>
                      <div className="tel-scope-desc">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={12}>
          <Card className="tel-card" title="模块使用排行（PV）" extra={<span className="tel-card-extra">近 30 天</span>} style={{ height: 320, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 12, flex: 1, minHeight: 0 } }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 8 }} />
            ) : moduleData.length === 0 ? (
              <div className="tel-chart-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无排行数据" />
              </div>
            ) : (
              <EchartsBar data={moduleData} dataTitle="页面访问" barWidth={18} barSeriesOption={MODULE_BAR_SERIES} options={barOptions} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="tel-card" title="功能使用排行（近 30 天）" extra={<span className="tel-card-extra">按事件编码</span>} style={{ height: 320, display: 'flex', flexDirection: 'column' }} styles={{ body: { padding: 12, flex: 1, minHeight: 0 } }}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: 8 }} />
            ) : eventData.length === 0 ? (
              <div className="tel-chart-empty">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无排行数据" />
              </div>
            ) : (
              <EchartsBar data={eventData} dataTitle="使用次数" barWidth={18} barSeriesOption={EVENT_BAR_SERIES} options={barOptions} />
            )}
          </Card>
        </Col>
      </Row>
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
          {loading ? (
            <Skeleton.Input active size="small" style={{ width: 92, marginTop: 4 }} />
          ) : (
            <div className="tel-metric-value" style={{ color: config.color }}>{formatNum(value)}</div>
          )}
        </div>
      </Card>
    </Col>
  );
}
