import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Space } from 'antd';
import {
  BaseBizTable,
  BaseDrawer,
  BaseTableUtils,
  clearForm,
  type FaberTable,
  FaHref,
  FaUtils,
  useTableQueryParams,
} from '@fa/ui';
import type { Admin } from '@/types';
import { telemetryIssueApi as api } from '@features/fa-admin-pages/services';
import IssueView from './cube/IssueView';

const serviceName = '客户端异常 Issue';

export default function TelemetryIssueList() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.ClientErrorIssue>(api.page, {}, serviceName);

  function updateStatus(id: number, status: Admin.TelemetryIssueStatus) {
    api.updateStatus(id, status).then((res) => {
      FaUtils.showResponse(res, '更新 Issue 状态');
      if (res.status === 200) fetchPageList();
    });
  }

  function genColumns(): FaberTable.ColumnsProp<Admin.ClientErrorIssue>[] {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      BaseTableUtils.genSimpleSorterColumn('应用 ID', 'appId', 90, sorter),
      BaseTableUtils.genSimpleSorterColumn('客户端', 'clientType', 90, sorter),
      BaseTableUtils.genSimpleSorterColumn('异常类型', 'errorType', 140, sorter),
      BaseTableUtils.genSimpleSorterColumn('标题', 'title', 300, sorter),
      BaseTableUtils.genSimpleSorterColumn('状态', 'status', 100, sorter),
      BaseTableUtils.genSimpleSorterColumn('事件数', 'eventCount', 90, sorter),
      BaseTableUtils.genSimpleSorterColumn('用户数', 'userCount', 90, sorter),
      BaseTableUtils.genSimpleSorterColumn('首次出现', 'firstSeenTime', 170, sorter),
      BaseTableUtils.genSimpleSorterColumn('最后出现', 'lastSeenTime', 170, sorter),
      {
        title: '操作',
        dataIndex: 'menu',
        width: 220,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
        render: (_, record) => <Space>
          <BaseDrawer triggerDom={<FaHref icon={<EyeOutlined />} text="详情" />}><IssueView record={record} /></BaseDrawer>
          <Button size="small" onClick={() => updateStatus(record.id, 'OPEN')}>打开</Button>
          <Button size="small" onClick={() => updateStatus(record.id, 'RESOLVED')}>解决</Button>
          <Button size="small" onClick={() => updateStatus(record.id, 'IGNORED')}>忽略</Button>
        </Space>,
      },
    ];
  }

  return <div className="fa-full-content-p12 fa-flex-column fa-content">
    <Form form={form} layout="inline" onFinish={setFormValues} className="fa-mtb12">
      <Form.Item name="appId" label="应用 ID"><Input allowClear /></Form.Item>
      <Form.Item name="status" label="状态"><Input placeholder="OPEN / RESOLVED / IGNORED" allowClear /></Form.Item>
      <Form.Item name="errorType" label="异常类型"><Input allowClear /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
      <Button onClick={() => clearForm(form)}>重置</Button>
    </Form>
    <BaseBizTable
      biz="base_client_error_issue"
      rowKey="id"
      columns={genColumns()}
      pagination={paginationProps}
      loading={loading}
      dataSource={list}
      onChange={handleTableChange}
      refreshList={fetchPageList}
    />
  </div>;
}
