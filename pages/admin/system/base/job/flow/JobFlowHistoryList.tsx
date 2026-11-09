import { useEffect, useRef, useState } from 'react';
import { Alert, Button, DatePicker, Form, InputNumber, Select, Space, Table, Tag, Tooltip, Typography, theme } from 'antd';
import { useApiLoading, useTableQueryParams } from '@fa/ui';
import dayjs from 'dayjs';
import type { Admin } from '@/types';
import { jobApi } from '@features/fa-admin-pages/services';
import { historyFilters } from './flowHistoryFilters';
import { formatHistoryDuration, normalizeHistoryStats } from './flowHistoryStats';
import './job-flow-history-stats.scss';
const states = [{ value: 1, label: '执行中' }, { value: 2, label: '成功' }, { value: 8, label: '未确认' }, { value: 9, label: '失败' }];
const sources = [{ value: 0, label: '历史/未知' }, { value: 1, label: '手动' }, { value: 2, label: '定时' }];
export default function JobFlowHistoryList({ jobId, selected, onSelect, active, refreshToken }: { active: boolean; refreshToken: number; jobId: number; selected?: number; onSelect: (id: number) => void }) {
  const [form] = Form.useForm();
  const pending = useRef<AbortController>();
  const [failed, setFailed] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof normalizeHistoryStats>>();
  const [statsFailed, setStatsFailed] = useState(false);
  const statsLoading = useApiLoading([jobApi.getUrl(`flowRunsStats/${jobId}`)]);
  const { token } = theme.useToken();
  const api = (params: any) => {
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller; setFailed(false);
    setStats(undefined); setStatsFailed(false);
    void jobApi.flowRunsStats(jobId, params, controller.signal).then(response => {
      if (!controller.signal.aborted && pending.current === controller) setStats(normalizeHistoryStats(response.data));
    }).catch(() => {
      if (!controller.signal.aborted && pending.current === controller) setStatsFailed(true);
    });
    return jobApi.flowRunsPage(jobId, params, controller.signal).catch(error => { if (!controller.signal.aborted) setFailed(true); throw error; });
  };
  const { list, loading, paginationProps, handleTableChange, setFormValues, fetchPageList } = useTableQueryParams<Admin.JobLog>(api, {}, '流程历史运行');
  const refreshRef = useRef(fetchPageList); refreshRef.current = fetchPageList;
  const initialized = useRef(false);
  useEffect(() => {
    if (!active) pending.current?.abort();
    else if (initialized.current) refreshRef.current();
    initialized.current = true;
  }, [active, refreshToken]);
  useEffect(() => () => pending.current?.abort(), []);
  const submit = () => {
    setFormValues(historyFilters(form.getFieldsValue()));
  };
  return <Space className="job-flow-history-list" orientation="vertical" size={12} style={{ width: '100%' }}>
    <Form form={form} layout="inline" onFinish={submit} style={{ rowGap: 8 }}>
      <Form.Item name="logId"><InputNumber min={1} precision={0} placeholder="运行 ID" aria-label="运行 ID" /></Form.Item>
      <Form.Item name="status"><Select allowClear placeholder="执行状态" aria-label="执行状态" options={states} style={{ width: 120 }} /></Form.Item>
      <Form.Item name="triggerSource"><Select allowClear placeholder="触发来源" aria-label="触发来源" options={sources} style={{ width: 120 }} /></Form.Item>
      <Form.Item name="range"><DatePicker.RangePicker showTime presets={[1, 7, 30].map(days => ({ label: `近${days}天`, value: [dayjs().subtract(days, 'day'), dayjs()] as [dayjs.Dayjs, dayjs.Dayjs] }))} /></Form.Item>
      <Space><Button htmlType="submit" type="primary">查询</Button><Button onClick={() => { form.resetFields(); setFormValues({}); }}>重置</Button><Button loading={loading} onClick={fetchPageList}>刷新</Button></Space>
    </Form>
    <div className="job-flow-history-stats-heading"><Typography.Text type="secondary">当前查询匹配的历史运行</Typography.Text>{statsLoading && <Typography.Text type="secondary">统计中…</Typography.Text>}{statsFailed && <span><Typography.Text type="warning">统计加载失败</Typography.Text><Button type="link" size="small" onClick={fetchPageList}>重试</Button></span>}</div>
    <section className="job-flow-history-stats" aria-label="历史运行统计" aria-busy={statsLoading}>
      {[
        { label: '匹配运行', value: stats?.total, color: token.colorText },
        { label: '成功', value: stats?.success, color: token.colorSuccessText },
        { label: '失败', value: stats?.failed, color: token.colorErrorText },
        { label: '执行中', value: stats?.doing, color: token.colorPrimaryText },
        { label: '未确认', value: stats?.unconfirmed, color: token.colorWarningText },
      ].map(item => <div key={item.label}><strong style={{ color: item.color }}>{item.value ?? '—'}</strong><span>{item.label}</span></div>)}
      <Tooltip title={`仅完整统计口径、成功或失败且耗时有效的运行参与平均；样本 ${stats?.durationSamples ?? '—'} 条。`}><div><strong>{formatHistoryDuration(stats?.avgDurationMs)}</strong><span>平均耗时</span></div></Tooltip>
    </section>
    {failed && <Alert type="error" title="历史记录加载失败，请刷新重试" />}
    <Table<Admin.JobLog> locale={{ emptyText: failed ? '加载失败，请刷新重试' : '未找到匹配的运行记录，请检查筛选条件' }} rowKey="id" size="small" loading={loading} dataSource={failed ? [] : list} scroll={{ x: 680 }}
      pagination={{ ...paginationProps, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: total => `共 ${total} 条` }} onChange={handleTableChange}
      onRow={record => ({ onClick: () => onSelect(record.id), style: { cursor: 'pointer', background: record.id === selected ? 'var(--ant-color-primary-bg)' : undefined } })}
      columns={[
        { title: '运行 ID', dataIndex: 'id', width: 85 },
        { title: '状态', dataIndex: 'status', width: 90, render: value => <Tag color={value === 9 ? 'error' : value === 2 ? 'success' : value === 1 ? 'processing' : 'warning'}>{states.find(item => item.value === value)?.label ?? '未知'}</Tag> },
        { title: '开始时间', dataIndex: 'beginTime', width: 165 },
        { title: '结束时间', dataIndex: 'endTime', width: 165, responsive: ['lg'], render: value => value ?? '—' },
        { title: '来源', dataIndex: 'triggerSource', width: 90, responsive: ['md'], render: value => sources.find(item => item.value === value)?.label ?? '未知' },
        { title: '耗时(ms)', dataIndex: 'durationMs', width: 100, render: value => value ?? '—' },
        { title: '版本 ID', dataIndex: 'definitionVersionId', width: 90, responsive: ['lg'] },
        { title: '操作', width: 70, render: (_, record) => <Button type="link" size="small" onClick={event => { event.stopPropagation(); onSelect(record.id); }}>查看</Button> },
      ]} />
  </Space>;
}
