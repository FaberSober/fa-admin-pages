import { CopyOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { FaUtils, getToken, useApiLoading, useQs } from '@fa/ui';
import { licenseApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Alert, Button, Card, Descriptions, message, Result, Space, Spin, Tag, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

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

function safeRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/license-error')) return '/';
  return value;
}

export default function LicenseErrorPage() {
  const search: any = useQs();
  const [license, setLicense] = useState<Admin.LicenseStatus>();
  const [recovery, setRecovery] = useState<Admin.LicenseRecoveryStatus>();
  const [recoveryFile, setRecoveryFile] = useState<File>();
  const machineId = typeof search.machineId === 'string' ? search.machineId.trim() : '';
  const returnUrl = safeRedirect(typeof search.redirect === 'string' ? search.redirect : null);
  const loading = useApiLoading(licenseApi.getUrl('info'));
  const recoveryLoading = useApiLoading(licenseApi.getUrl('recovery-info'));
  const recoveryImporting = useApiLoading(licenseApi.getUrl('recovery-import'));
  const statusMeta = license ? STATUS_META[license.status] : undefined;
  const recoveryStatusMeta = recovery?.status ? STATUS_META[recovery.status] : undefined;

  useEffect(() => {
    if (machineId || !getToken()) return;

    let mounted = true;
    licenseApi
      .info()
      .then((response) => {
        if (mounted) setLicense(response.data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [machineId]);

  useEffect(() => {
    if (!machineId) return;

    let mounted = true;
    licenseApi
      .recoveryInfo(machineId)
      .then((response) => {
        if (mounted) setRecovery(response.data);
      })
      .catch(() => {
        if (mounted) setRecovery(undefined);
      });

    return () => {
      mounted = false;
    };
  }, [machineId]);

  function retry() {
    window.location.replace(returnUrl);
  }

  function goHome() {
    window.location.replace('/');
  }

  function copyMachineId() {
    if (license?.machineId) FaUtils.copyToClipboard(license.machineId, 'Machine ID');
  }

  function handleBeforeRecoveryUpload(file: File) {
    if (!file.name.toLowerCase().endsWith('.lic')) {
      message.error('仅支持 .lic 授权文件');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 64 * 1024) {
      message.error('License 文件不能超过 64 KB');
      return Upload.LIST_IGNORE;
    }
    setRecoveryFile(file);
    return false;
  }

  async function handleRecoveryImport() {
    if (!machineId || !recoveryFile || !recovery?.uploadAllowed) return;
    try {
      const response = await licenseApi.recoveryImport(recoveryFile, machineId);
      setRecovery(response.data);
      setRecoveryFile(undefined);
      message.success('授权恢复成功，正在重新检测');
      window.setTimeout(() => window.location.replace(returnUrl), 500);
    } catch {
      // 请求拦截器负责显示后端返回的错误信息。
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        backgroundColor: 'var(--fa-bg-grey, #f5f5f5)',
      }}
    >
      <Result
        status="error"
        title="系统授权暂不可用"
        subTitle="当前产品授权已失效，请联系系统管理员或服务提供商处理。"
        extra={
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={retry}>
              重新检测
            </Button>
            <Button onClick={goHome}>返回首页</Button>
          </Space>
        }
      />

      {loading && <Spin size="small" />}

      {machineId && recoveryLoading && <Spin size="small" tip="正在校验恢复入口" />}

      {machineId && !recoveryLoading && recovery && !recovery.matched && (
        <Alert
          type="warning"
          showIcon
          style={{ width: 'min(760px, 100%)' }}
          message="授权恢复入口校验失败"
          description="当前 URL 中的机器码与本服务器不匹配，暂不开放恢复操作。"
        />
      )}

      {machineId && recovery?.matched && (
        <Card title="应急授权恢复" style={{ width: 'min(760px, 100%)' }}>
          <Descriptions bordered column={2} size="small" className="fa-mb12">
            <Descriptions.Item label="机器码校验">已匹配当前服务器</Descriptions.Item>
            <Descriptions.Item label="授权模式">{modeLabel(recovery.mode)}</Descriptions.Item>
            <Descriptions.Item label="授权状态">
              <Tag color={recoveryStatusMeta?.color || 'error'}>{recoveryStatusMeta?.label || display(recovery.status)}</Tag>
            </Descriptions.Item>
          </Descriptions>

          {recovery.mode === 'ONLINE' && (
            <Alert type="info" showIcon message="当前为在线授权模式" description="在线模式不支持上传离线 License，请配置 FA_LICENSE_KEY 后重新启动服务。" />
          )}

          {recovery.mode === 'OFFLINE' && recovery.uploadAllowed && (
            <>
              <Alert
                className="fa-mb12"
                type="warning"
                showIcon
                message="已开放离线授权恢复"
                description="仅支持当前服务器的有效 .lic 授权文件，上传后会替换现有离线授权文件。"
              />
              <Space wrap>
                <Upload
                  key={recoveryFile?.name || 'recovery-license-upload'}
                  accept=".lic"
                  maxCount={1}
                  showUploadList={false}
                  disabled={recoveryImporting}
                  beforeUpload={handleBeforeRecoveryUpload}
                >
                  <Button icon={<UploadOutlined />} disabled={recoveryImporting}>
                    选择授权文件
                  </Button>
                </Upload>
                <Typography.Text type="secondary">{recoveryFile ? recoveryFile.name : '尚未选择文件'}</Typography.Text>
                <Button type="primary" loading={recoveryImporting} disabled={!recoveryFile} onClick={() => void handleRecoveryImport()}>
                  上传并恢复
                </Button>
              </Space>
            </>
          )}

          {recovery.mode === 'OFFLINE' && !recovery.uploadAllowed && (
            <Alert type="info" showIcon message="当前不允许执行匿名恢复" description="请登录超级管理员后进行授权操作，或确认当前授权状态。" />
          )}
        </Card>
      )}

      {license?.canViewDiagnostics && (
        <Card title="授权诊断信息" style={{ width: 'min(760px, 100%)' }}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="授权状态">
              <Tag color={statusMeta?.color || 'error'}>{statusMeta?.label || license.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="授权开关">{license.enabled ? '已启用' : '已关闭'}</Descriptions.Item>
            <Descriptions.Item label="授权模式">{modeLabel(license.mode)}</Descriptions.Item>
            <Descriptions.Item label="产品">{display(license.product)}</Descriptions.Item>
            <Descriptions.Item label="Machine ID" span={2}>
              <Space>
                <Typography.Text style={{ wordBreak: 'break-all' }}>{display(license.machineId)}</Typography.Text>
                <Button type="link" size="small" icon={<CopyOutlined />} disabled={!license.machineId} onClick={copyMachineId}>
                  复制
                </Button>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="License ID">{display(license.licenseId)}</Descriptions.Item>
            <Descriptions.Item label="客户">{display(license.customer)}</Descriptions.Item>
            <Descriptions.Item label="签发时间">{formatDateTime(license.issuedAt)}</Descriptions.Item>
            <Descriptions.Item label="到期时间">{formatDateTime(license.expireAt)}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
