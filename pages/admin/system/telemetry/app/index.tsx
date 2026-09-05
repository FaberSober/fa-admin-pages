import { SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, type FaberTable, useDelete, useTableQueryParams } from '@fa/ui';
import { telemetryAppApi as api } from '@features/fa-admin-pages/services';
import type { Admin } from '@/types';
import TelemetryAppModal from './modal/TelemetryAppModal';

const serviceName = 'Telemetry 应用';

export default function TelemetryAppPage() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.TelemetryApp>(api.page, {}, serviceName);
  const [handleDelete] = useDelete<number>(api.remove, fetchPageList, serviceName);

  function genColumns(): FaberTable.ColumnsProp<Admin.TelemetryApp>[] {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      BaseTableUtils.genSimpleSorterColumn('应用名称', 'appName', 160, sorter),
      BaseTableUtils.genSimpleSorterColumn('应用编码', 'appCode', 160, sorter),
      BaseTableUtils.genSimpleSorterColumn('AppKey', 'appKey', 180, sorter),
      BaseTableUtils.genSimpleSorterColumn('客户端类型', 'clientType', 110, sorter),
      BaseTableUtils.genBoolSorterColumn('允许上报', 'enabled', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('备注', 'remark', 200, sorter),
      ...BaseTableUtils.genCtrColumns(sorter),
      {
        title: '操作', dataIndex: 'opr', width: 120, fixed: 'right', tcRequired: true, tcType: 'menu',
        render: (_, record) => <Space>
          <TelemetryAppModal editBtn title="编辑 Telemetry 应用" record={record} fetchFinish={fetchPageList} />
          <AuthDelBtn handleDelete={() => handleDelete(record.id)} />
        </Space>,
      },
    ];
  }

  return <div className="fa-content fa-full fa-flex-column">
    <div className="fa-flex-row-center fa-p8" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div className="fa-h3">应用管理</div>
      <Form form={form} layout="inline" onFinish={({ enabled, ...values }) => setFormValues({ ...values, enabled: enabled === undefined ? undefined : enabled === 'true' })}>
        <Form.Item name="appName" label="名称"><Input allowClear /></Form.Item>
        <Form.Item name="appKey" label="AppKey"><Input allowClear /></Form.Item>
        <Form.Item name="clientType" label="客户端"><Select allowClear style={{ width: 120 }} options={['WEB', 'DESKTOP', 'MOBILE', 'OTHER'].map(value => ({ value, label: value }))} /></Form.Item>
        <Form.Item name="enabled" label="状态"><Select allowClear style={{ width: 100 }} options={[{ value: 'true', label: '启用' }, { value: 'false', label: '停用' }]} /></Form.Item>
        <Space>
          <Button htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
          <Button onClick={() => clearForm(form)}>重置</Button>
          <TelemetryAppModal addBtn title="新增 Telemetry 应用" fetchFinish={fetchPageList} />
        </Space>
      </Form>
    </div>
    <BaseBizTable rowKey="id" biz="base_telemetry_app" columns={genColumns()} pagination={paginationProps} loading={loading} dataSource={list} onChange={handleTableChange} refreshList={fetchPageList} />
  </div>;
}
