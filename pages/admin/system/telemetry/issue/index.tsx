import { TelemetryAppProvider, TelemetryAppSelect, TelemetryAppName, TelemetryIssueStatusTag, issueStatuses, clientTypes, telemetryLabel } from '@features/fa-admin-pages/components/telemetry';
import { useRef, useState } from 'react';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space, Tooltip, message } from 'antd';
import {
  BaseBizTable,
  BaseDrawer,
  BaseTableUtils,
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
  return <TelemetryAppProvider><TelemetryIssueListContent /></TelemetryAppProvider>;
}

function TelemetryIssueListContent() {
  const [form] = Form.useForm();
  const { queryParams, setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.ClientErrorIssue>(api.page, {}, serviceName);

  const locks = useRef(new Set<number>());
  const [pending, setPending] = useState<Record<number, Admin.TelemetryIssueStatus>>({});

  async function updateStatus(record: Admin.ClientErrorIssue, status: Admin.TelemetryIssueStatus) {
    if (record.status === status || loading || locks.current.has(record.id)) return;
    locks.current.add(record.id);
    setPending(previous => ({ ...previous, [record.id]: status }));
    try {
      const res = await api.updateStatus(record.id, status);
      FaUtils.showResponse(res, '更新 Issue 状态');
      if (res.status === 200) fetchPageList();
    } catch {
      message.error('状态更新失败，请重试');
    } finally {
      locks.current.delete(record.id);
      setPending(previous => { const next = { ...previous }; delete next[record.id]; return next; });
    }
  }

  function genColumns(): FaberTable.ColumnsProp<Admin.ClientErrorIssue>[] {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      { ...BaseTableUtils.genSimpleSorterColumn('应用', 'appId', 200, sorter), render: (_, record) => <TelemetryAppName appId={record.appId} /> },
      { ...BaseTableUtils.genSimpleSorterColumn('客户端', 'clientType', 110, sorter), render: (_, record) => telemetryLabel(clientTypes, record.clientType) },
      BaseTableUtils.genSimpleSorterColumn('异常类型', 'errorType', 140, sorter),
      { ...BaseTableUtils.genSimpleSorterColumn('标题', 'title', 300, sorter), ellipsis: true, render: (_, record) => <Tooltip title={record.title}><span>{record.title}</span></Tooltip> },
      { ...BaseTableUtils.genSimpleSorterColumn('状态', 'status', 100, sorter), render: (_, record) => <TelemetryIssueStatusTag status={record.status} /> },
      BaseTableUtils.genSimpleSorterColumn('事件数', 'eventCount', 90, sorter),
      BaseTableUtils.genSimpleSorterColumn('受影响用户数', 'userCount', 120, sorter),
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
          {issueStatuses.map(option => <Button key={option.value} size="small"
            disabled={record.status === option.value || loading || Boolean(pending[record.id])}
            loading={pending[record.id] === option.value}
            onClick={() => updateStatus(record, option.value)}>{option.action}</Button>)}
        </Space>,
      },
    ];
  }

  return <div className="fa-full-content-p12 fa-flex-column fa-content">
    <Form form={form} layout="inline" onFinish={setFormValues} className="fa-mtb12" style={{ rowGap: 12, columnGap: 8 }}>
      <Form.Item name="appId" label="应用"><TelemetryAppSelect /></Form.Item>
      <Form.Item name="status" label="状态"><Select allowClear placeholder="全部状态" style={{ width: 140 }} options={issueStatuses.map(({ value, label }) => ({ value, label }))} /></Form.Item>
      <Form.Item name="errorType" label="异常类型"><Input allowClear style={{ width: 160 }} /></Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>查询</Button>
      <Button onClick={() => { form.resetFields(); setFormValues({}); }}>重置</Button>
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
