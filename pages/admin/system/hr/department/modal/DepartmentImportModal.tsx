import { UploadOutlined } from '@ant-design/icons';
import { type Fa, FaFullContentModal, FaUtils, UploadFileLocal } from '@fa/ui';
import { departmentApi } from '@features/fa-admin-pages/services';
import type { DepartmentImportPreview } from '@features/fa-admin-pages/services/base/admin/department';
import { Alert, Button, Card, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

interface DepartmentImportModalProps {
  fetchFinish?: () => void;
}

export default function DepartmentImportModal({ fetchFinish }: DepartmentImportModalProps) {
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState<string>();
  const [preview, setPreview] = useState<DepartmentImportPreview>();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);

  function reset() {
    setFileId(undefined);
    setPreview(undefined);
    setPreviewLoading(false);
    setCommitLoading(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      reset();
    }
  }

  function handleFileChange(nextFileId: string | string[] | undefined) {
    setFileId(typeof nextFileId === 'string' ? nextFileId : undefined);
    setPreview(undefined);
  }

  async function handlePreview() {
    if (!fileId) return;
    setPreviewLoading(true);
    try {
      const response = await departmentApi.previewImport({ fileId });
      if (response.status === 200) {
        setPreview(response.data);
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleCommit() {
    if (!fileId || !preview || preview.errorCount > 0) return;
    setCommitLoading(true);
    try {
      const response = await departmentApi.commitImport({ fileId });
      FaUtils.showResponse(response as Fa.Ret, '导入部门');
      if (response.status === 200) {
        fetchFinish?.();
        setOpen(false);
        reset();
      }
    } finally {
      setCommitLoading(false);
    }
  }

  return (
    <FaFullContentModal
      title="导入部门"
      triggerDom={
        <Button icon={<UploadOutlined />} onClick={reset}>
          导入
        </Button>
      }
      open={open}
      onOpenChange={handleOpenChange}
      onCancel={() => handleOpenChange(false)}
      onOk={handleCommit}
      okText="确认导入"
      confirmLoading={commitLoading}
      showOk={Boolean(preview && preview.errorCount === 0)}
    >
      <Space direction="vertical" size={16} style={{ display: 'flex' }}>
        <Card size="small" title="1. 上传导入文件">
          <Space wrap>
            <UploadFileLocal value={fileId} onChange={handleFileChange} accept={FaUtils.FileAccept.EXCEL} />
            <Button type="primary" disabled={!fileId} loading={previewLoading} onClick={handlePreview}>
              预览校验
            </Button>
            <Button type="link" onClick={() => departmentApi.downloadImportTemplate()}>
              下载部门导入模板
            </Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>
            部门ID填写已有ID时更新部门，留空时新增部门；上级部门ID填写0或已有部门ID；类型支持 CORP、DEPT、TEAM 或 公司、部门、小组；负责人ID可留空。
          </Typography.Paragraph>
        </Card>

        {!preview && <Alert type="info" showIcon message="上传文件后点击“预览校验”，确认无错误后才能提交导入。" />}

        {preview && (
          <Card size="small" title="2. 预览结果">
            <Space wrap>
              <Statistic title="总行数" value={preview.totalCount} />
              <Statistic title="可导入" value={preview.validCount} valueStyle={{ color: '#1677ff' }} />
              <Statistic title="新增" value={preview.createCount} valueStyle={{ color: '#52c41a' }} />
              <Statistic title="更新" value={preview.updateCount} valueStyle={{ color: '#722ed1' }} />
              <Statistic title="错误" value={preview.errorCount} valueStyle={{ color: preview.errorCount > 0 ? '#ff4d4f' : '#52c41a' }} />
            </Space>

            <Alert
              className="fa-mt12"
              type={preview.errorCount > 0 ? 'error' : 'success'}
              showIcon
              message={preview.errorCount > 0 ? '存在校验错误，请修正文件后重新上传预览。' : '校验通过，可以确认导入。'}
            />

            {preview.errors.length > 0 && (
              <Table
                className="fa-mt12"
                size="small"
                rowKey={(item) => String(item.rowNumber)}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                dataSource={preview.errors}
                columns={[
                  { title: '行号', dataIndex: 'rowNumber', width: 80 },
                  { title: '部门名称', dataIndex: 'departmentName', width: 180, render: (value) => value || <Tag>未填写</Tag> },
                  { title: '错误信息', dataIndex: 'message' },
                ]}
              />
            )}
          </Card>
        )}
      </Space>
    </FaFullContentModal>
  );
}
