import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Descriptions, Form, Input, Select, Space } from 'antd';
import { BaseBizTable, BaseDrawer, BaseTableUtils, clearForm, FaHref, type FaberTable, useTableQueryParams } from '@fa/ui';
import type { Admin } from '@/types';
import { telemetryStatEventApi as api } from '@features/fa-admin-pages/services';

export default function TelemetryStatEventList() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.StatEvent>(api.page, {}, 'Telemetry 业务事件');
  const { sorter } = queryParams;
  const columns: FaberTable.ColumnsProp<Admin.StatEvent>[] = [
    BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
    BaseTableUtils.genSimpleSorterColumn('客户端', 'clientType', 90, sorter),
    BaseTableUtils.genSimpleSorterColumn('事件类型', 'eventType', 100, sorter),
    BaseTableUtils.genSimpleSorterColumn('事件编码', 'eventCode', 220, sorter),
    BaseTableUtils.genSimpleSorterColumn('模块', 'module', 120, sorter),
    BaseTableUtils.genSimpleSorterColumn('用户', 'userId', 110, sorter),
    BaseTableUtils.genSimpleSorterColumn('结果', 'result', 90, sorter),
    BaseTableUtils.genSimpleSorterColumn('环境', 'environment', 90, sorter),
    BaseTableUtils.genSimpleSorterColumn('版本', 'release', 120, sorter),
    BaseTableUtils.genSimpleSorterColumn('Session', 'sessionId', 160, sorter),
    BaseTableUtils.genSimpleSorterColumn('发生时间', 'occurTime', 170, sorter),
    {
      title: '操作', dataIndex: 'menu', width: 90, fixed: 'right',
      render: (_, record) => <BaseDrawer triggerDom={<FaHref icon={<EyeOutlined />} text="详情" />}><EventDetail record={record} /></BaseDrawer>,
    },
  ];

  return <div className="fa-full-content-p12 fa-flex-column fa-content">
    <Form form={form} layout="inline" onFinish={setFormValues} className="fa-mtb12">
      <Form.Item name="appId" label="应用 ID"><Input allowClear /></Form.Item>
      <Form.Item name="clientType" label="客户端"><Select allowClear style={{ width: 120 }} options={['WEB', 'DESKTOP', 'MOBILE', 'OTHER'].map((value) => ({ value }))} /></Form.Item>
      <Form.Item name="environment" label="环境"><Input allowClear /></Form.Item>
      <Form.Item name="release" label="版本"><Input allowClear /></Form.Item>
      <Form.Item name="eventType" label="事件类型"><Select allowClear style={{ width: 130 }} options={['LOGIN', 'PAGE_VIEW', 'ACTION', 'BUSINESS'].map((value) => ({ value }))} /></Form.Item>
      <Form.Item name="eventCode" label="事件编码"><Input allowClear /></Form.Item>
      <Form.Item name="userId" label="用户"><Input allowClear /></Form.Item>
      <Form.Item name="sessionId" label="Session"><Input allowClear /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
      <Button onClick={() => clearForm(form)}>重置</Button>
    </Form>
    <BaseBizTable biz="base_stat_event" rowKey="id" columns={columns} pagination={paginationProps} loading={loading} dataSource={list} onChange={handleTableChange} refreshList={fetchPageList} />
  </div>;
}

function EventDetail({ record }: { record: Admin.StatEvent }) {
  return <Descriptions column={1} size="small" bordered>
    <Descriptions.Item label="事件">{record.eventCode}</Descriptions.Item>
    <Descriptions.Item label="类型">{record.eventType}</Descriptions.Item>
    <Descriptions.Item label="模块">{record.module || '--'}</Descriptions.Item>
    <Descriptions.Item label="用户 / 租户">{record.userId || '--'} / {record.tenantId || '--'}</Descriptions.Item>
    <Descriptions.Item label="结果 / 耗时">{record.result || '--'} / {record.duration ?? '--'} ms</Descriptions.Item>
    <Descriptions.Item label="属性"><pre>{JSON.stringify(record.properties, null, 2)}</pre></Descriptions.Item>
    <Descriptions.Item label="上下文"><pre>{JSON.stringify(record.context, null, 2)}</pre></Descriptions.Item>
  </Descriptions>;
}
