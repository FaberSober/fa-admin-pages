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
import { Alert, Button, Empty, Form, Input, Modal, Space, Table, type TableColumnsType, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useRef, useState } from 'react';

const kickPermission = '/admin/system/monitor/onlineUser:kickout';

const formatTime = (value: number | string | null | undefined) => {
  if (value == null || value === '') return '-';
  const timestamp = Number(value);
  return Number.isFinite(timestamp) ? dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss') : '-';
};

export default function OnlineUserSessionList() {
  const [form] = Form.useForm();
  const [selectedUser, setSelectedUser] = useState<OnlineUser.SessionUserSummary>();
  const [sessions, setSessions] = useState<OnlineUser.Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState(false);
  const requestId = useRef(0);
  const kickingSession = useApiLoading(onlineUserApi.getUrl('kickout'));
  const kickingUser = useApiLoading(onlineUserApi.getUrl('kickoutUser'));
  const loadPage = useCallback((params: Fa.BasePageProps) => onlineUserApi.sessionUserPage(params), []);
  const { setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } = useTableQueryParams<OnlineUser.SessionUserSummary>(
    loadPage,
    {},
    '后台登录会话',
  );

  async function loadSessions(userId: string) {
    const currentRequestId = ++requestId.current;
    setSessions([]);
    setSessionsLoading(true);
    setSessionsError(false);
    try {
      const res = await onlineUserApi.userSessions(userId);
      if (currentRequestId === requestId.current) setSessions(res.data ?? []);
    } catch {
      if (currentRequestId === requestId.current) setSessionsError(true);
    } finally {
      if (currentRequestId === requestId.current) setSessionsLoading(false);
    }
  }

  function openSessions(record: OnlineUser.SessionUserSummary) {
    setSelectedUser(record);
    void loadSessions(record.userId);
  }

  function closeSessions() {
    requestId.current += 1;
    setSelectedUser(undefined);
    setSessions([]);
    setSessionsError(false);
    setSessionsLoading(false);
  }

  function confirmKickoutSession(record: OnlineUser.Session) {
    Modal.confirm({
      title: '使这个后台登录会话失效？',
      content: (
        <div>
          <p>账号：{record.name || record.username}</p>
          <p>设备标识：{record.clientInstanceId || '未上报'}</p>
          <p>会话标识：{record.id.slice(0, 12)}</p>
        </div>
      ),
      okText: '确认失效',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await onlineUserApi.kickout(record.id, false);
        FaUtils.showResponse(res, '后台登录会话失效');
        await loadSessions(record.userId);
        fetchPageList();
      },
    });
  }

  function confirmKickoutUser(record: OnlineUser.SessionUserSummary) {
    Modal.confirm({
      title: '使该账号的全部后台登录会话失效？',
      content: (
        <p>
          {record.name || record.username}（{record.username}）的后台 Web 登录会话将全部下线。
        </p>
      ),
      okText: '确认全部下线',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await onlineUserApi.kickoutUser(record.userId);
        FaUtils.showResponse(res, '全部后台会话下线');
        if (selectedUser?.userId === record.userId) await loadSessions(record.userId);
        fetchPageList();
      },
    });
  }

  const sessionColumns: TableColumnsType<OnlineUser.Session> = [
    { title: '会话标识', dataIndex: 'id', width: 125, render: (value: string) => value.slice(0, 12) },
    {
      title: '客户端',
      dataIndex: 'clientType',
      width: 100,
      render: (value: string | null) => <Tag>{value || 'WEB'}</Tag>,
    },
    {
      title: '设备实例（最近上报）',
      dataIndex: 'clientInstanceId',
      width: 170,
      ellipsis: true,
      render: (value: string | null) =>
        value ? <Tooltip title={value}>{value.length > 22 ? `${value.slice(0, 10)}…${value.slice(-8)}` : value}</Tooltip> : '未上报',
    },
    {
      title: '浏览器 / 系统',
      width: 180,
      render: (_, record) => [record.browser, record.os].filter(Boolean).join(' / ') || '-',
    },
    { title: 'IP', dataIndex: 'ip', width: 140, render: (value: string | null) => value || '-' },
    { title: '登录时间', dataIndex: 'loginTime', width: 170, render: formatTime },
    { title: '最近访问', dataIndex: 'lastAccessTime', width: 170, render: formatTime },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      width: 170,
      render: (value: number | string | null) => (value == null ? '永不过期' : formatTime(value)),
    },
    {
      title: '状态',
      dataIndex: 'active',
      width: 120,
      render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? '近期活跃' : '有效未活跃'}</Tag>,
    },
    {
      title: '操作',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <ShiroPermissionContainer permission={kickPermission}>
          <Button
            type="link"
            size="small"
            danger
            disabled={kickingSession || record.current}
            title={record.current ? '不能撤销当前登录会话' : undefined}
            onClick={() => confirmKickoutSession(record)}
          >
            失效
          </Button>
        </ShiroPermissionContainer>
      ),
    },
  ];

  const columns: FaberTable.ColumnsProp<OnlineUser.SessionUserSummary> = [
    { ...BaseTableUtils.genSimpleSorterColumn('账号', 'username', 160, false), render: (value: string) => value || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('姓名', 'name', 140, false), render: (value: string | null) => value || '-' },
    {
      ...BaseTableUtils.genSimpleSorterColumn('有效会话数', 'sessionCount', 120, false),
      render: (value: number | string) => <Tag color="blue">{Number(value) || 0}</Tag>,
    },
    {
      ...BaseTableUtils.genSimpleSorterColumn('近期活跃', 'activeSessionCount', 110, false),
      render: (value: number | string) => Number(value) || 0,
    },
    { ...BaseTableUtils.genTimeSorterColumn('最近访问', 'lastAccessTime', 180, false), render: formatTime },
    {
      title: '操作',
      dataIndex: 'opr',
      width: 190,
      fixed: 'right',
      tcRequired: true,
      tcType: 'menu',
      render: (_, record) => (
        <Space>
          <BaseDrawer
            title={`${record.name || record.username}（${record.username}）的后台登录会话`}
            triggerDom={
              <Button type="link" size="small" onClick={() => openSessions(record)}>
                会话明细
              </Button>
            }
            size={1450}
            onClose={closeSessions}
          >
            {sessionsError ? (
              <Empty description="会话明细加载失败">
                <Button onClick={() => void loadSessions(record.userId)}>重试</Button>
              </Empty>
            ) : (
              <Table<OnlineUser.Session>
                size="small"
                rowKey="id"
                columns={sessionColumns}
                dataSource={selectedUser?.userId === record.userId ? sessions : []}
                loading={sessionsLoading && selectedUser?.userId === record.userId}
                pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个有效会话` }}
                scroll={{ x: 1450 }}
                locale={{ emptyText: sessionsLoading ? '加载中' : '暂无有效会话' }}
              />
            )}
          </BaseDrawer>
          <ShiroPermissionContainer permission={kickPermission}>
            <Button
              type="link"
              size="small"
              danger
              disabled={kickingUser || record.currentUser}
              title={record.currentUser ? '不能下线当前管理员账号' : undefined}
              onClick={() => confirmKickoutUser(record)}
            >
              全部失效
            </Button>
          </ShiroPermissionContainer>
        </Space>
      ),
    },
  ];

  return (
    <div className="fa-full fa-flex-column fa-content">
      <div className="fa-flex-row-center fa-p8" style={{ gap: 24, flexWrap: 'wrap' }}>
        <div className="fa-h3">有效后台登录会话</div>
        <Space>
          <span>
            有效账号 <strong>{paginationProps.total ?? '-'}</strong>
          </span>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchPageList}>
            刷新
          </Button>
        </Space>
      </div>
      <Alert
        type="info"
        showIcon
        title="此列表按后台 Web 登录会话状态统计，不依赖 WebSocket 心跳；一个账号一行，展开后可按会话查看设备标识并逐个失效。共享 Token 的设备信息按最近一次请求更新，撤销会影响使用该 Token 的所有浏览器。"
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
      <BaseBizTable<OnlineUser.SessionUserSummary>
        biz="base_online_user_session_v1"
        rowKey="userId"
        columns={columns}
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
