import { UploadOutlined } from '@ant-design/icons';
import { type Fa, FaFullContentModal, FaUtils, UploadFileLocal } from '@fa/ui';
import { userApi } from '@features/fa-admin-pages/services';
import type { UserImportPreview } from '@features/fa-admin-pages/services/base/admin/user';
import { Alert, Button, Card, Space, Statistic, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

interface UserImportModalProps {
  departmentId?: string;
  superMode?: boolean;
  scopeDescription: string;
  fetchFinish?: () => void;
}

export default function UserImportModal({ departmentId, superMode = false, scopeDescription, fetchFinish }: UserImportModalProps) {
  const [open, setOpen] = useState(false);
  const [fileId, setFileId] = useState<string>();
  const [preview, setPreview] = useState<UserImportPreview>();
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
      const response = await userApi.previewImport({ fileId, departmentIdSuper: departmentId, superMode });
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
      const response = await userApi.commitImport({ fileId, departmentIdSuper: departmentId, superMode });
      FaUtils.showResponse(response as Fa.Ret, '导入用户');
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
      title="导入用户"
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
            <Button type="link" onClick={() => userApi.downloadImportTemplate()}>
              下载用户导入模板
            </Button>
          </Space>
          <Typography.Paragraph type="secondary" style={{ margin: '12px 0 0' }}>
            当前导入范围：{scopeDescription}。部门建议填写完整路径，例如“总部/研发部”；已有用户填写用户ID用于更新，新增用户必须填写初始密码。
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
                  { title: '用户名', dataIndex: 'username', width: 160, render: (value) => value || <Tag>未填写</Tag> },
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
