import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  BaseBizTable,
  BaseDrawer,
  BaseTableUtils,
  type Fa,
  type FaberTable,
  FaUtils,
  ShiroPermissionContainer,
  useApiLoading,
  useTableQueryParams,
} from '@fa/ui';
import { onlineUserApi } from '@features/fa-admin-pages/services';
import type { OnlineUser } from '@features/fa-admin-pages/types';
import { Alert, Button, Empty, Form, Input, Modal, Space, Table, type TableColumnsType, Tag } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';

const formatTime = (value: number | string | null | undefined) => {
  if (value == null || value === '') return '-';
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-';
};
const kickPermission = '/admin/system/monitor/onlineUser:kickout';
const clientTypeLabels: Record<OnlineUser.PresenceDevice['clientType'], string> = {
  WEB: 'Web',
  MOBILE: 'APP',
  DESKTOP: '桌面端',
};

export default function OnlineUserList() {
  const [form] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState<OnlineUser.PresenceSummary>();
  const [devices, setDevices] = useState<OnlineUser.PresenceDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState(false);
  const kicking = useApiLoading(onlineUserApi.getUrl('kickoutUser'));
  const deviceRequestId = useRef(0);
  const loadPage = useCallback((params: Fa.BasePageProps) => onlineUserApi.presencePage(params), []);
  const { setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } = useTableQueryParams<OnlineUser.PresenceSummary>(
    loadPage,
    {},
    '在线用户',
  );

  async function loadDevices(userId: string) {
    const requestId = ++deviceRequestId.current;
    setDevices([]);
    setDevicesLoading(true);
    setDevicesError(false);
    try {
      const res = await onlineUserApi.presenceDevices(userId);
      if (requestId === deviceRequestId.current) setDevices(res.data ?? []);
    } catch {
      if (requestId === deviceRequestId.current) setDevicesError(true);
    } finally {
      if (requestId === deviceRequestId.current) setDevicesLoading(false);
    }
  }

  function openDevices(record: OnlineUser.PresenceSummary) {
    setSelectedUser(record);
    void loadDevices(record.userId);
  }

  function closeDevices() {
    deviceRequestId.current += 1;
    setSelectedUser(undefined);
    setDevices([]);
    setDevicesError(false);
    setDevicesLoading(false);
  }

  function confirmKickout(record: OnlineUser.PresenceSummary) {
    Modal.confirm({
      title: '下线该用户全部后台 Web 会话？',
      content: (
        <div>
          <p>
            目标用户：{record.name || record.username}（{record.username}）
          </p>
          <p>该用户的后台 Web 登录会话将失效；APP 和桌面端不受影响。</p>
          <p>Web 会话在下次请求时返回登录页，相关在线状态会在连接关闭或心跳超时后更新。</p>
        </div>
      ),
      okText: '确认下线',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await onlineUserApi.kickoutUser(record.userId);
        FaUtils.showResponse(res, '全部后台下线');
        fetchPageList();
      },
    });
  }

  const deviceColumns: TableColumnsType<OnlineUser.PresenceDevice> = [
    {
      title: '客户端',
      dataIndex: 'clientType',
      width: 90,
      render: (value: OnlineUser.PresenceDevice['clientType']) => <Tag>{clientTypeLabels[value] || value}</Tag>,
    },
    {
      title: '应用',
      width: 180,
      render: (_, record) => (record.appName ? `${record.appName}${record.appCode ? `（${record.appCode}）` : ''}` : record.appCode || '-'),
    },
    { title: '版本', dataIndex: 'release', width: 100, render: (value: string | null) => value || '-' },
    { title: '环境', dataIndex: 'environment', width: 110, render: (value: string | null) => value || '-' },
    {
      title: '平台 / 操作系统',
      width: 180,
      render: (_, record) => [record.platform, [record.osName, record.osVersion].filter(Boolean).join(' ')].filter(Boolean).join(' / ') || '-',
    },
    { title: '设备型号', dataIndex: 'deviceModel', width: 140, ellipsis: true, render: (value: string | null) => value || '-' },
    { title: '连接时间', dataIndex: 'connectedAt', width: 170, render: formatTime },
    { title: '最近心跳', dataIndex: 'lastSeenAt', width: 170, render: formatTime },
  ];

  function genColumns(): FaberTable.ColumnsProp<OnlineUser.PresenceSummary> {
    return [
      { ...BaseTableUtils.genSimpleSorterColumn('账号', 'username', 160, false), render: (value: string) => value || '-' },
      { ...BaseTableUtils.genSimpleSorterColumn('姓名', 'name', 130, false), render: (value: string | null) => value || '-' },
      {
        ...BaseTableUtils.genSimpleSorterColumn('Web 在线', 'webCount', 110, false),
        render: (value: number | string) => <Tag color={Number(value) > 0 ? 'green' : 'default'}>{Number(value) || 0}</Tag>,
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('APP 在线', 'appCount', 110, false),
        render: (value: number | string) => <Tag color={Number(value) > 0 ? 'green' : 'default'}>{Number(value) || 0}</Tag>,
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('桌面端在线', 'desktopCount', 120, false),
        render: (value: number | string) => <Tag color={Number(value) > 0 ? 'green' : 'default'}>{Number(value) || 0}</Tag>,
      },
      {
        ...BaseTableUtils.genSimpleSorterColumn('设备总数', 'deviceCount', 120, false),
        render: (value: number | string) => Number(value) || 0,
      },
      { ...BaseTableUtils.genTimeSorterColumn('最近心跳', 'lastSeenAt', 180, false), render: formatTime },
      {
        title: '操作',
        dataIndex: 'opr',
        width: 150,
        fixed: 'right',
        tcRequired: true,
        tcType: 'menu',
        render: (_, record) => (
          <Space>
            <BaseDrawer
              title={`${record.name || record.username}（${record.username}）的在线设备`}
              triggerDom={
                <Button type="link" size="small" onClick={() => openDevices(record)}>
                  全部设备
                </Button>
              }
              size={1200}
              onClose={closeDevices}
            >
              {devicesError ? (
                <Empty description="设备明细加载失败">
                  <Button onClick={() => void loadDevices(record.userId)}>重试</Button>
                </Empty>
              ) : (
                <Table<OnlineUser.PresenceDevice>
                  size="small"
                  rowKey={(device, index) => `${device.clientType}-${device.connectedAt}-${device.lastSeenAt}-${index}`}
                  columns={deviceColumns}
                  dataSource={devices}
                  loading={devicesLoading && selectedUser?.userId === record.userId}
                  pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 台设备` }}
                  scroll={{ x: 1080 }}
                  locale={{ emptyText: devicesLoading ? '加载中' : '暂无在线设备' }}
                />
              )}
            </BaseDrawer>
            <ShiroPermissionContainer permission={kickPermission}>
              <Button type="link" size="small" danger disabled={kicking} onClick={() => confirmKickout(record)}>
                全部后台下线
              </Button>
            </ShiroPermissionContainer>
          </Space>
        ),
      },
    ];
  }

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content">
      <div className="fa-flex-row-center fa-p8" style={{ gap: 24, flexWrap: 'wrap' }}>
        <div className="fa-h3">在线用户</div>
        <Space>
          <span>
            在线用户 <strong>{paginationProps.total ?? '-'}</strong>
          </span>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchPageList}>
            刷新
          </Button>
        </Space>
      </div>
      <Alert
        type="info"
        showIcon
        title="在线状态按客户端 WebSocket 心跳统计，同一用户的多平台设备汇总为一行。"
        description="设备按客户端实例去重；旧客户端在兼容期内可能按连接计数。超过 60 秒未收到心跳或连接关闭后，在线状态会更新。"
      />
      <Form form={form} layout="inline" onFinish={(values) => setFormValues(values)} className="fa-p8" style={{ rowGap: 8 }}>
        <Form.Item name="keyword" label="用户">
          <Input placeholder="账号 / 姓名" allowClear maxLength={100} />
        </Form.Item>
        <Space>
          <Button htmlType="submit" icon={<SearchOutlined />} loading={loading}>
            查询
          </Button>
          <Button
            onClick={() => {
              form.resetFields();
              setFormValues({});
            }}
          >
            重置
          </Button>
        </Space>
      </Form>
      <BaseBizTable<OnlineUser.PresenceSummary>
        biz="base_online_user_v1"
        rowKey="userId"
        columns={genColumns()}
        loading={loading}
        dataSource={list}
        pagination={{ ...paginationProps, pageSizeOptions: ['10', '20', '50', '100'] }}
        onChange={handleTableChange}
        refreshList={fetchPageList}
        showCheckbox={false}
        showComplexQuery={false}
        showBatchDelBtn={false}
      />
    </div>
  );
}
