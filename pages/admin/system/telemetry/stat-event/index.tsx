import { TelemetryAppProvider, TelemetryAppSelect, TelemetryAppName, clientTypes, environments, eventTypes, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Descriptions, Form, Input, Select } from 'antd';
import { BaseBizTable, BaseDrawer, BaseTableUtils, FaHref, type FaberTable, useTableQueryParams } from '@fa/ui';
import type { Admin } from '@/types';
import { telemetryStatEventApi as api } from '@features/fa-admin-pages/services';

export default function TelemetryStatEventList() {
  return <TelemetryAppProvider><TelemetryStatEventListContent /></TelemetryAppProvider>;
}

function TelemetryStatEventListContent() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.StatEvent>(api.page, {}, 'Telemetry 业务事件');
  const { sorter } = queryParams;
  const columns: FaberTable.ColumnsProp<Admin.StatEvent>[] = [
    BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
    { ...BaseTableUtils.genSimpleSorterColumn('应用', 'appId', 200, sorter), render: (_, record) => <TelemetryAppName appId={record.appId} /> },
    { ...BaseTableUtils.genSimpleSorterColumn('客户端', 'clientType', 110, sorter), render: (_, record) => telemetryLabel(clientTypes, record.clientType) },
    { ...BaseTableUtils.genSimpleSorterColumn('事件类型', 'eventType', 110, sorter), render: (_, record) => telemetryLabel(eventTypes, record.eventType) },
    BaseTableUtils.genSimpleSorterColumn('事件编码', 'eventCode', 220, sorter),
    BaseTableUtils.genSimpleSorterColumn('模块', 'module', 120, sorter),
    BaseTableUtils.genSimpleSorterColumn('用户', 'userId', 110, sorter),
    BaseTableUtils.genSimpleSorterColumn('结果', 'result', 90, sorter),
    { ...BaseTableUtils.genSimpleSorterColumn('环境', 'environment', 110, sorter), render: (_, record) => telemetryLabel(environments, record.environment) },
    BaseTableUtils.genSimpleSorterColumn('版本', 'release', 120, sorter),
    BaseTableUtils.genSimpleSorterColumn('会话', 'sessionId', 260, sorter),
    BaseTableUtils.genSimpleSorterColumn('发生时间', 'occurTime', 170, sorter),
    {
      title: '操作', dataIndex: 'menu', width: 90, fixed: 'right',
      tcRequired: true,
      tcType: 'menu',
      render: (_, record) => <BaseDrawer triggerDom={<FaHref icon={<EyeOutlined />} text="详情" />}><EventDetail record={record} /></BaseDrawer>,
    },
  ];

  return <div className="fa-full-content-p12 fa-flex-column fa-content">
    <Form form={form} layout="inline" onFinish={setFormValues} className="fa-mtb12" style={{ rowGap: 12, columnGap: 8 }}>
      <Form.Item name="appId" label="应用"><TelemetryAppSelect /></Form.Item>
      <Form.Item name="clientType" label="客户端"><Select allowClear style={{ width: 120 }} options={clientTypes} /></Form.Item>
      <Form.Item name="environment" label="环境"><Select allowClear placeholder="全部环境" style={{ width: 140 }} options={environments} /></Form.Item>
      <Form.Item name="release" label="版本"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="eventType" label="事件类型"><Select allowClear style={{ width: 130 }} options={eventTypes} /></Form.Item>
      <Form.Item name="eventCode" label="事件编码"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="userId" label="用户"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="sessionId" label="会话"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
      <Button onClick={() => { form.resetFields(); setFormValues({}); }}>重置</Button>
    </Form>
    <BaseBizTable biz="base_stat_event" rowKey="id" columns={columns} pagination={paginationProps} loading={loading} dataSource={list} onChange={handleTableChange} refreshList={fetchPageList} />
  </div>;
}

function EventDetail({ record }: { record: Admin.StatEvent }) {
  return <Descriptions column={1} size="small" bordered>
    <Descriptions.Item label="事件">{record.eventCode}</Descriptions.Item>
    <Descriptions.Item label="应用"><TelemetryAppName appId={record.appId} /></Descriptions.Item>
    <Descriptions.Item label="客户端 / 环境">{telemetryLabel(clientTypes, record.clientType)} / {telemetryLabel(environments, record.environment)}</Descriptions.Item>
    <Descriptions.Item label="类型">{telemetryLabel(eventTypes, record.eventType)}</Descriptions.Item>
    <Descriptions.Item label="模块">{record.module || '--'}</Descriptions.Item>
    <Descriptions.Item label="用户 / 租户">{record.userId || '--'} / {record.tenantId || '--'}</Descriptions.Item>
    <Descriptions.Item label="结果 / 耗时">{record.result || '--'} / {record.duration ?? '--'} ms</Descriptions.Item>
    <Descriptions.Item label="属性"><pre>{JSON.stringify(record.properties, null, 2)}</pre></Descriptions.Item>
    <Descriptions.Item label="上下文"><pre>{JSON.stringify(record.context, null, 2)}</pre></Descriptions.Item>
  </Descriptions>;
}
