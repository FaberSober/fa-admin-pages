import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { FaUtils, getToken } from '@fa/ui';
import { licenseApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Button, Card, Descriptions, Result, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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
  const [searchParams] = useSearchParams();
  const [license, setLicense] = useState<Admin.LicenseStatus>();
  const [loading, setLoading] = useState(false);
  const returnUrl = safeRedirect(searchParams.get('redirect'));
  const statusMeta = license ? STATUS_META[license.status] : undefined;

  useEffect(() => {
    if (!getToken()) return;

    let mounted = true;
    setLoading(true);
    licenseApi
      .info()
      .then((response) => {
        if (mounted) setLicense(response.data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  function retry() {
    window.location.replace(returnUrl);
  }

  function goHome() {
    window.location.replace('/');
  }

  function copyMachineId() {
    if (license?.machineId) FaUtils.copyToClipboard(license.machineId, 'Machine ID');
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
