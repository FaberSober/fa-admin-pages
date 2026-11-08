import { DownloadOutlined, PauseCircleOutlined, PlayCircleOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Badge, Button, Form, Input, Popconfirm, Space, Tooltip } from 'antd';
import {
  AuthDelBtn,
  BaseBizTable,
  BaseDrawer,
  BaseTableUtils,
  clearForm,
  type FaberTable,
  FaUtils,
  useDelete,
  useExport,
  useTableQueryParams
} from '@fa/ui';
import type { Admin } from '@/types';
import { jobApi } from '@features/fa-admin-pages/services';
import JobModal from './modal/JobModal';
import JobFlowPreview from './flow/JobFlowPreview';
import JobLogList from "./jobLog/JobLogList";
import JobExecutionStatus from './JobExecutionStatus';
import { formatJobAverage, formatJobCount, formatJobDuration, formatJobTotalDuration } from './jobStatistics';

const serviceName = '定时任务';
const biz = 'base_job';

export default function JobList() {
  const [form] = Form.useForm();

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.Job>(jobApi.page, { sorter: { field: 'id', order: 'descend' } }, serviceName);

  const [exporting, fetchExportExcel] = useExport(jobApi.exportExcel, queryParams);
  const [handleDelete] = useDelete<number>(jobApi.remove, fetchPageList, serviceName);

  /** 确定立即执行一次该任务 */
  function handleRunOneTime(id: number) {
    jobApi.runOneTime(id).then((res) => FaUtils.showResponse(res, '立即执行任务'));
  }

  /** 任务启停 */
  function handleJobStatus(record: Admin.Job) {
    if (!record.status) {
      jobApi
        .startJob(record.id)
        .then((res) => FaUtils.showResponse(res, '启动任务'))
        .then(() => fetchPageList());
    } else {
      jobApi
        .endJob(record.id)
        .then((res) => FaUtils.showResponse(res, '停止任务'))
        .then(() => fetchPageList());
    }
  }

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genSimpleSorterColumn('ID', 'id', 70, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('任务名称', 'jobName', 240, sorter),
        render: (val, record) => (
          <BaseDrawer triggerDom={<a>{val}</a>} size={1000}>
            <JobLogList jobId={record.id} />
          </BaseDrawer>
        ),
      },
      BaseTableUtils.genSimpleSorterColumn('cron表达式', 'cron', 120, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('调度状态', 'status', 90, sorter),
        render: (val) => (val ? <Badge status="processing" text="已启用" /> : <Badge status="default" text="已暂停" />),
      },
      {
        ...BaseTableUtils.genTimeSorterColumn('最近开始时间', 'lastExecuteTime', 180, sorter),
        render: (val) => FaUtils.getDateFullStr(val) || '—',
      },
      {
        ...BaseTableUtils.genTimeSorterColumn('最近结束时间', 'lastEndTime', 180, sorter),
        render: (val, record) => record.lastTrackingVersion === 2 ? '—' : FaUtils.getDateFullStr(val) || '—',
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('最近执行结果', 'lastStatus', 160, sorter),
        render: (_, record) => <JobExecutionStatus status={record.lastStatus} trackingVersion={record.lastTrackingVersion} />,
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('最近总耗时', 'lastDurationMs', 125, sorter),
        render: (_, record) => (
          <Tooltip title={`总耗时包含排队及全部关联子任务；触发耗时：${formatJobDuration(record.lastDispatchDurationMs)}`}>
            <span>{formatJobTotalDuration(record.lastDurationMs, record.lastStatus, record.lastTrackingVersion)}</span>
          </Tooltip>
        ),
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('累计执行次数', 'executeCount', 120, sorter),
        render: (_, record) => (
          <Tooltip title={`成功：${formatJobCount(record.successCount)}；失败：${formatJobCount(record.failCount)}。以升级时保留的历史记录初始化，旧成功结果可能仅代表入口返回。`}>
            <span>{formatJobCount(record.executeCount)}</span>
          </Tooltip>
        ),
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('失败次数', 'failCount', 110, sorter),
        render: (val) => formatJobCount(val),
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('平均总耗时', 'avgDurationMs', 125, false, true, true),
        render: (_, record) => (
          <Tooltip title={`耗时统计起始时间：${FaUtils.getDateFullStr(record.statsSince) || '尚未开始统计'}；参与平均的执行次数：${formatJobCount(record.durationSampleCount)}。仅统计已确认结束的执行，成功和失败均包含；历史记录、尚未结束及无法确认完成的执行不参与平均。`}>
            <span>{formatJobAverage(record.avgDurationMs, record.durationSampleCount)}</span>
          </Tooltip>
        ),
      },
      BaseTableUtils.genSimpleSorterColumn('任务执行方法', 'clazzPath', 400, sorter),
      BaseTableUtils.genSimpleSorterColumn('任务描述', 'jobDesc', undefined, sorter),
      ...BaseTableUtils.genCtrColumns(sorter),
      ...BaseTableUtils.genUpdateColumns(sorter),
      {
        title: '操作',
        dataIndex: 'opr',
        render: (_: string, record: Admin.Job) => (
          <Space>
            <Popconfirm title="确定立即执行一次该任务" onConfirm={() => handleRunOneTime(record.id)}>
              <a><ThunderboltOutlined />执行</a>
            </Popconfirm>
            <Popconfirm
              title={!record.status ? '确定启动任务?' : '确定停止任务?'}
              onConfirm={() => handleJobStatus(record)}
            >
              {!record.status ? <a><PlayCircleOutlined />启动</a> : <a><PauseCircleOutlined />停止</a>}
            </Popconfirm>
            {!record.status && <JobModal editBtn title={`编辑${serviceName}信息`} record={record} fetchFinish={fetchPageList} />}
            <AuthDelBtn handleDelete={() => handleDelete(record.id)} />
          </Space>
        ),
        width: 230,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.Job>[];
  }

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content">
      <div className="fa-flex-row-center fa-p8">
        <div className="fa-h3">{serviceName}</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Form form={form} layout="inline" onFinish={setFormValues}>
            <Form.Item name="jobName" label="任务名称">
              <Input placeholder="请输入任务名称" />
            </Form.Item>

            <Space>
              <Button htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={() => clearForm(form)}>重置</Button>
              <JobFlowPreview />
              <JobModal addBtn title={`新增${serviceName}信息`} fetchFinish={fetchPageList} />
              <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>
                导出
              </Button>
            </Space>
          </Form>
        </div>
      </div>

      <BaseBizTable
        biz={biz}
        columns={genColumns()}
        pagination={paginationProps}
        loading={loading}
        dataSource={list}
        rowKey={(item) => item.id}
        onChange={handleTableChange}
        refreshList={() => fetchPageList()}
        batchDelete={(ids) => jobApi.removeBatchByIds(ids)}
        onSceneChange={(v) => setSceneId(v)}
        onConditionChange={(cL) => setConditionList(cL)}
      />
    </div>
  );
}
