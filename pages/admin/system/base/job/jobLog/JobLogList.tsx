import { useEffect, useState } from 'react';
import { CopyOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, theme, Typography } from 'antd';
import { AuthDelBtn, BaseBizTable, BaseTableUtils, clearForm, type FaberTable, FaEnums, FaUtils, useDelete, useExport, useTableQueryParams } from '@fa/ui';
import { useLocation } from 'react-router-dom';
import type { Admin } from '@/types';
import { jobLogApi } from '@features/fa-admin-pages/services';
import JobLogDetailDrawer from './JobLogDetailDrawer';

const serviceName = '系统定时任务-执行日志';
const biz = 'base_job_log';

export interface JobLogListProps {
  jobId: number;
}

export default function JobLogList({ jobId }: JobLogListProps) {
  const [form] = Form.useForm();
  const [errorRecord, setErrorRecord] = useState<Admin.JobLog | null>(null);
  const { pathname, search } = useLocation();
  const { token } = theme.useToken();

  const { queryParams, setFormValues, handleTableChange, setSceneId, setConditionList, setExtraParams, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<Admin.JobLog>(jobLogApi.page, { extraParams: { jobId } }, serviceName);

  const [handleDelete] = useDelete<number>(jobLogApi.remove, fetchPageList, serviceName);
  const [exporting, fetchExportExcel] = useExport(jobLogApi.exportExcel, queryParams);

  useEffect(() => {
    setExtraParams({ jobId });
  }, [jobId]);

  useEffect(() => {
    setErrorRecord(null);
  }, [jobId, pathname, search]);

  /** 生成表格字段List */
  function genColumns() {
    const { sorter } = queryParams;
    return [
      BaseTableUtils.genIdColumn('ID', 'id', 70, sorter),
      BaseTableUtils.genSimpleSorterColumn('执行时长', 'duration', 100, sorter),
      BaseTableUtils.genTimeSorterColumn('开始时间', 'beginTime', 180, sorter),
      BaseTableUtils.genTimeSorterColumn('结束时间', 'endTime', 180, sorter),
      {
        ...BaseTableUtils.genSimpleSorterColumn('执行结果', 'status', 100, sorter),
        render: (_, record) => <span>{FaEnums.JOB_LOG_STATUS_MAP[record.status]}</span>,
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('错误日志', 'errMsg', 360, sorter),
        ellipsis: { showTitle: false },
        render: (_, record) => record.errMsg?.trim() ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div style={{
              flex: 1, minWidth: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden', whiteSpace: 'normal', overflowWrap: 'anywhere',
            }}>
              {record.errMsg}
            </div>
            <Button type="link" size="small" style={{ flexShrink: 0 }}
              aria-label={`查看执行记录 #${record.id} 的错误日志`} onClick={() => setErrorRecord(record)}>
              详情
            </Button>
          </div>
        ) : <Typography.Text type="secondary">—</Typography.Text>,
      },
      {
        title: '操作',
        dataIndex: 'opr',
        render: (_, record) => (
          <Space size={4} style={{ whiteSpace: 'nowrap' }}>
            <JobLogDetailDrawer record={record} />
            <AuthDelBtn handleDelete={() => handleDelete(record.id)} />
          </Space>
        ),
        width: 200,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
      },
    ] as FaberTable.ColumnsProp<Admin.JobLog>[];
  }

  return (
    <div className="fa-full-content fa-flex-column fa-bg-white" style={{ left: 4 }}>
      <div className="fa-flex-row-center fa-p8">
        <div className="fa-h3">{serviceName}</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Form form={form} layout="inline" onFinish={setFormValues}>
            <Form.Item name="errMsg" label="错误日志">
              <Input placeholder="请输入错误日志" />
            </Form.Item>
          </Form>

          <Space>
            <Button onClick={() => form.submit()} loading={loading} icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={() => clearForm(form)}>重置</Button>
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
        batchDelete={(ids) => jobLogApi.removeBatchByIds(ids)}
        onSceneChange={(v) => setSceneId(v)}
        onConditionChange={(cL) => setConditionList(cL)}
      />

      <Modal title={`错误日志 #${errorRecord?.id ?? ''}`} open={errorRecord !== null} width={960}
        destroyOnHidden onCancel={() => setErrorRecord(null)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={() => FaUtils.copyToClipboard(errorRecord?.errMsg || '', '错误日志')}>
            复制错误日志
          </Button>,
          <Button key="close" onClick={() => setErrorRecord(null)}>关闭</Button>,
        ]}>
        <Input.TextArea readOnly spellCheck={false} aria-label="错误日志内容" value={errorRecord?.errMsg || ''}
          style={{ height: 'min(60vh, 560px)', resize: 'none', fontFamily: token.fontFamilyCode, overflowWrap: 'anywhere' }} />
      </Modal>
    </div>
  );
}
