import { TelemetryAppProvider, TelemetryAppSelect, TelemetryAppName, clientTypes, environments, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space } from 'antd';
import { BaseBizTable, BaseDrawer, BaseTableUtils, type FaberTable, FaHref, useTableQueryParams } from '@fa/ui';
import type { Admin } from '@/types';
import { telemetryErrorEventApi as api } from '@features/fa-admin-pages/services';
import ErrorEventView from './cube/ErrorEventView';

export default function TelemetryErrorEventList() {
  return <TelemetryAppProvider><TelemetryErrorEventListContent /></TelemetryAppProvider>;
}

function TelemetryErrorEventListContent() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.ClientErrorEvent>(api.page, {}, '客户端异常事件');
  const { sorter } = queryParams;
  const columns: FaberTable.ColumnsProp<Admin.ClientErrorEvent>[] = [
    BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
    { ...BaseTableUtils.genSimpleSorterColumn('应用', 'appId', 200, sorter), render: (_, record) => <TelemetryAppName appId={record.appId} /> },
    { ...BaseTableUtils.genSimpleSorterColumn('客户端', 'clientType', 110, sorter), render: (_, record) => telemetryLabel(clientTypes, record.clientType) },
    BaseTableUtils.genSimpleSorterColumn('Issue ID', 'issueId', 90, sorter),
    BaseTableUtils.genSimpleSorterColumn('异常类型', 'errorType', 140, sorter),
    BaseTableUtils.genSimpleSorterColumn('消息', 'message', 320, sorter),
    { ...BaseTableUtils.genSimpleSorterColumn('环境', 'environment', 110, sorter), render: (_, record) => telemetryLabel(environments, record.environment) },
    BaseTableUtils.genSimpleSorterColumn('版本', 'release', 130, sorter),
    BaseTableUtils.genSimpleSorterColumn('用户', 'userId', 120, sorter),
    BaseTableUtils.genSimpleSorterColumn('会话', 'sessionId', 260, sorter),
    BaseTableUtils.genSimpleSorterColumn('发生时间', 'occurTime', 170, sorter),
    {
      title: '操作',
      dataIndex: 'menu',
      width: 90,
      fixed: 'right',
      tcRequired: true,
      tcType: 'menu',
      render: (_, record) => (
        <Space>
          <BaseDrawer triggerDom={<FaHref icon={<EyeOutlined />} text="详情" />}>
            <ErrorEventView record={record} />
          </BaseDrawer>
        </Space>
      )
    },
  ];
  return <div className="fa-full-content-p12 fa-flex-column fa-content">
    <Form form={form} layout="inline" onFinish={setFormValues} className="fa-mtb12" style={{ rowGap: 12, columnGap: 8 }}>
      <Form.Item name="issueId" label="Issue ID"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="appId" label="应用"><TelemetryAppSelect /></Form.Item>
      <Form.Item name="clientType" label="客户端"><Select allowClear style={{ width: 120 }} options={clientTypes} /></Form.Item>
      <Form.Item name="environment" label="环境"><Select allowClear placeholder="全部环境" style={{ width: 140 }} options={environments} /></Form.Item>
      <Form.Item name="release" label="版本"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="errorType" label="异常类型"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="userId" label="用户"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Form.Item name="sessionId" label="会话"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
      <Button onClick={() => { form.resetFields(); setFormValues({}); }}>重置</Button>
    </Form>
    <BaseBizTable biz="base_client_error_event" rowKey="id" columns={columns} pagination={paginationProps} loading={loading} dataSource={list} onChange={handleTableChange} refreshList={fetchPageList} />
  </div>;
}
