import { BugOutlined, FileTextOutlined, LoginOutlined, ReloadOutlined, ThunderboltOutlined, UserOutlined } from '@ant-design/icons';
import { EchartsBar, EchartsLine } from '@features/fa-admin-pages/components';
import { telemetryDashboardApi } from '@features/fa-admin-pages/services';
import type { Admin, Fa } from '@/types';
import { Button, Card, Col, Row, Segmented, Space, Statistic, Tag } from 'antd';
import dayjs from 'dayjs';
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react';

const EMPTY_OVERVIEW: Admin.TelemetryDashboardOverview = {
  activeUserCount: 0,
  loginUserCount: 0,
  pageViewCount: 0,
  businessEventCount: 0,
  errorCount: 0,
  affectedUserCount: 0,
};

export default function TelemetryDashboard() {
  const [days, setDays] = useState<7 | 30>(7);
  const [overview, setOverview] = useState<Admin.TelemetryDashboardOverview>();
  const [trend, setTrend] = useState<Admin.TelemetryDashboardTrend[]>([]);
  const [moduleRank, setModuleRank] = useState<Admin.TelemetryDashboardRank[]>([]);
  const [eventRank, setEventRank] = useState<Admin.TelemetryDashboardRank[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
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
    } finally {
      setLoading(false);
    }
  }

  const data = overview || EMPTY_OVERVIEW;
  const trendDates = trend.map((item) => dayjs(item.statDate).format('MM-DD'));
  const moduleData: Fa.ChartArrayData[] = moduleRank.map((item) => ({ name: item.name, value: item.primaryCount }));
  const eventData: Fa.ChartArrayData[] = eventRank.map((item) => ({ name: item.name, value: item.primaryCount }));

  return <div className="fa-full-content fa-p12">
    <div className="fa-flex-row-between fa-mb12">
      <div>
        <div className="fa-fs18 fa-fw600">Telemetry 概览</div>
        <div className="fa-color-grey">今日实时指标与最近 {days} 天使用趋势</div>
      </div>
      <Space wrap>
        <Segmented<7 | 30> value={days} options={[{ label: '近 7 天', value: 7 }, { label: '近 30 天', value: 30 }]} onChange={setDays} />
        <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchData}>刷新</Button>
      </Space>
    </div>

    <Row gutter={[12, 12]} className="fa-mb12">
      <Metric title="今日活跃用户" value={data.activeUserCount} icon={<UserOutlined />} />
      <Metric title="今日登录用户" value={data.loginUserCount} icon={<LoginOutlined />} />
      <Metric title="页面访问 PV" value={data.pageViewCount} icon={<FileTextOutlined />} />
      <Metric title="业务操作" value={data.businessEventCount} icon={<ThunderboltOutlined />} />
      <Metric title="客户端异常" value={data.errorCount} icon={<BugOutlined />} valueStyle={{ color: '#cf1322' }} />
      <Metric title="受影响用户" value={data.affectedUserCount} icon={<UserOutlined />} valueStyle={{ color: '#d46b08' }} />
    </Row>

    <Row gutter={[12, 12]} className="fa-mb12">
      <Col xs={24} xl={16}>
        <Card title="使用与异常趋势" loading={loading} style={{ height: 350 }}>
          <EchartsLine
            dataX={trendDates}
            dataY={[
              { name: '活跃用户', data: trend.map((item) => item.activeUserCount) },
              { name: '登录次数', data: trend.map((item) => item.loginCount) },
              { name: '业务操作', data: trend.map((item) => item.businessEventCount) },
              { name: '异常', data: trend.map((item) => item.errorCount) },
            ]}
          />
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        <Card title="当前统计口径" loading={loading} style={{ height: 350 }}>
          <div className="fa-flex-column fa-gap12">
            <Tag color="blue">今日指标直接读取 Stat Event</Tag>
            <Tag color="green">历史趋势限定近 7 / 30 天</Tag>
            <Tag color="orange">业务排行统计近 30 天</Tag>
            <div className="fa-color-grey">每日汇总任务会保留长期聚合数据；当前页面以有限原始事件窗口保持计算准确性。</div>
          </div>
        </Card>
      </Col>
    </Row>

    <Row gutter={[12, 12]}>
      <Col xs={24} xl={12}>
        <Card title="模块使用排行（PV）" loading={loading} style={{ height: 320 }}>
          <EchartsBar data={moduleData} dataTitle="页面访问" />
        </Card>
      </Col>
      <Col xs={24} xl={12}>
        <Card title="功能使用排行（近 30 天）" loading={loading} style={{ height: 320 }}>
          <EchartsBar data={eventData} dataTitle="使用次数" />
        </Card>
      </Col>
    </Row>
  </div>;
}

function Metric({ title, value, icon, valueStyle }: { title: string; value: number; icon: ReactNode; valueStyle?: CSSProperties }) {
  return <Col xs={24} sm={12} lg={8} xxl={4}>
    <Card size="small">
      <Statistic title={title} value={value} prefix={icon} valueStyle={valueStyle} />
    </Card>
  </Col>;
}
