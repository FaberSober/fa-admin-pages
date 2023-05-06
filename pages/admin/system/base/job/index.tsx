import React from 'react';
import { DownloadOutlined, EditOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, SearchOutlined, ThunderboltOutlined, } from '@ant-design/icons';
import { Badge, Button, Form, Input, Popconfirm, Space } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, FaberTable, FaHref, FaUtils, useDelete, useExport, useTableQueryParams } from '@fa/ui';
import { Admin } from '@/types';
import { jobApi } from '@/services';
import JobModal from './modal/JobModal';
import JobLogDrawer from './jobLog/JobLogDrawer';

const serviceName = '系统定时任务';
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
          <JobLogDrawer jobId={record.id}>
            <a>{val}</a>
          </JobLogDrawer>
        ),
      },
      BaseTableUtils.genSimpleSorterColumn('cron表达式', 'cron', 120, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('状态', 'status', 80, sorter),
        render: (val) => (val ? <Badge status="processing" text="运作中" /> : <Badge status="default" text="暂停" />),
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
            <Popconfirm
              title="确定立即执行一次该任务"
              onConfirm={() => handleRunOneTime(record.id)}
              getPopupContainer={() => document.body}
            >
              <FaHref icon={<ThunderboltOutlined />} text="执行" />
            </Popconfirm>
            <Popconfirm
              title={!record.status ? '确定启动任务?' : '确定停止任务?'}
              onConfirm={() => handleJobStatus(record)}
              getPopupContainer={() => document.body}
            >
              {!record.status ? (
                <FaHref icon={<PlayCircleOutlined />} text="启动" />
              ) : (
                <FaHref icon={<PauseCircleOutlined />} text="停止" />
              )}
            </Popconfirm>
            {!record.status && (
              <JobModal title={`编辑${serviceName}信息`} record={record} fetchFinish={fetchPageList}>
                <FaHref icon={<EditOutlined />} text="编辑" />
              </JobModal>
            )}
            <AuthDelBtn handleDelete={() => handleDelete(record.id)} />
          </Space>
        ),
        width: 220,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.Job>[];
  }

  return (
    <div className="fa-full-content fa-flex-column fa-bg-white">
      <div className="fa-flex-row-center fa-p8">
        <strong style={{ fontSize: '18px' }}>{serviceName}</strong>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Form style={{ flex: 1, flexDirection: 'row-reverse' }} form={form} layout="inline" onFinish={setFormValues}>
            <Form.Item name="jobName" label="任务名称">
              <Input placeholder="请输入任务名称" />
            </Form.Item>
          </Form>

          <Space>
            <Button onClick={() => form.submit()} loading={loading} icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => clearForm(form)}>重置</Button>
            <JobModal title={`新增${serviceName}信息`} fetchFinish={fetchPageList}>
              <Button icon={<PlusOutlined />} type="primary">
                新增
              </Button>
            </JobModal>
            <Button loading={exporting} icon={<DownloadOutlined />} onClick={fetchExportExcel}>
              导出
            </Button>
          </Space>
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
