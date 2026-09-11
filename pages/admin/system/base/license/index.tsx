import { CopyOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { FaUtils, useApiLoading } from '@fa/ui';
import { licenseApi } from '@features/fa-admin-pages/services';
import { Alert, Button, Card, Descriptions, Empty, message, Space, Tag, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import type { Admin } from '@/types';

const MAX_LICENSE_BYTES = 64 * 1024;

const STATUS_META: Record<Admin.LicenseState, { label: string; color: string }> = {
  ACTIVE: { label: '有效', color: 'success' },
  GRACE: { label: '宽限期', color: 'warning' },
  BYPASSED: { label: '已关闭校验', color: 'processing' },
  EXPIRED: { label: '已过期', color: 'error' },
  DISABLED: { label: '已停用', color: 'error' },
  MACHINE_MISMATCH: { label: '机器码不匹配', color: 'error' },
  INVALID: { label: '无效', color: 'error' },
  TIME_ANOMALY: { label: '时间异常', color: 'error' },
  BLOCKED: { label: '已阻断', color: 'error' },
  UNCONFIGURED: { label: '未配置', color: 'error' },
};

const USABLE_STATES = new Set<Admin.LicenseState>(['ACTIVE', 'GRACE', 'BYPASSED']);

function display(value?: string | null) {
  return value || '-';
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = dayjs(value);
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : '-';
}

function modeLabel(mode?: Admin.LicenseMode) {
  if (mode === 'ONLINE') return '在线';
  if (mode === 'OFFLINE') return '离线';
  return '-';
}

export default function LicenseManagement() {
  const [license, setLicense] = useState<Admin.LicenseStatus>();
  const [file, setFile] = useState<File>();

  const loading = useApiLoading(licenseApi.getUrl('info'));
  const refreshing = useApiLoading(licenseApi.getUrl('refresh'));
  const importing = useApiLoading(licenseApi.getUrl('import'));

  useEffect(() => {
    void fetchLicense();
  }, []);

  function fetchLicense() {
    return licenseApi.info().then((response) => setLicense(response.data));
  }

  async function handleRefresh() {
    const response = await licenseApi.refresh();
    if (response.data) {
      setLicense(response.data);
      message.success('授权刷新完成');
    } else {
      await fetchLicense();
    }
  }

  function handleBeforeUpload(uploadFile: File) {
    if (!uploadFile.name.toLowerCase().endsWith('.lic')) {
      message.error('仅支持 .lic 授权文件');
      return Upload.LIST_IGNORE;
    }
    if (uploadFile.size > MAX_LICENSE_BYTES) {
      message.error('License 文件不能超过 64 KB');
      return Upload.LIST_IGNORE;
    }
    setFile(uploadFile);
    return false;
  }

  async function handleImport() {
    if (!file) return;
    const response = await licenseApi.importLicense(file);
    if (response.data) {
      setLicense(response.data);
      message.success('License 导入成功');
    } else {
      await fetchLicense();
    }
    setFile(undefined);
  }

  function copyMachineId() {
    if (license?.machineId) FaUtils.copyToClipboard(license.machineId, 'Machine ID');
  }

  const statusMeta = license ? STATUS_META[license.status] : undefined;
  const usable = license ? USABLE_STATES.has(license.status) : false;

  return (
    <div className="fa-full-content fa-p12 fa-flex-column fa-gap12">
      <Card
        title="授权状态"
        loading={loading}
        extra={
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={() => void handleRefresh()}>
            重新校验
          </Button>
        }
      >
        {!license ? (
          <Empty description="暂无授权信息，请重新校验" />
        ) : (
          <>
            <Space wrap className="fa-mb12">
              <Tag color={statusMeta?.color}>{statusMeta?.label || license.status}</Tag>
              <span>授权开关：{license.enabled ? '已启用' : '已关闭'}</span>
              <span>授权模式：{modeLabel(license.mode)}</span>
            </Space>

            {!usable && (
              <Alert className="fa-mb12" type="warning" showIcon message="系统授权已失效" description="请重新校验在线授权，或上传有效的离线 License。" />
            )}
            {license.status === 'GRACE' && <Alert className="fa-mb12" type="info" showIcon message="当前处于授权宽限期，请尽快完成在线重新校验。" />}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="License ID">{display(license.licenseId)}</Descriptions.Item>
              <Descriptions.Item label="产品">{display(license.product)}</Descriptions.Item>
              <Descriptions.Item label="客户">{display(license.customer)}</Descriptions.Item>
              <Descriptions.Item label="Machine ID">
                <Space>
                  <Typography.Text style={{ wordBreak: 'break-all' }}>{display(license.machineId)}</Typography.Text>
                  <Button type="link" size="small" icon={<CopyOutlined />} disabled={!license.machineId} onClick={copyMachineId}>
                    复制
                  </Button>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="签发时间">{formatDateTime(license.issuedAt)}</Descriptions.Item>
              <Descriptions.Item label="到期时间">{formatDateTime(license.expireAt)}</Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Card>

      <Card title="导入离线 License">
        <Alert className="fa-mb12" type="info" showIcon message="仅支持 .lic 文件，大小不超过 64 KB。文件会直接提交进行授权校验。" />
        <Space wrap>
          <Upload key={file?.name || 'license-upload'} accept=".lic" maxCount={1} showUploadList={false} disabled={importing} beforeUpload={handleBeforeUpload}>
            <Button icon={<UploadOutlined />} disabled={importing}>
              选择文件
            </Button>
          </Upload>
          <Typography.Text type="secondary">{file ? file.name : '尚未选择文件'}</Typography.Text>
          <Button type="primary" loading={importing} disabled={!file} onClick={() => void handleImport()}>
            导入并替换
          </Button>
        </Space>
      </Card>
    </div>
  );
}
