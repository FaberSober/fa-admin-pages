import { useCallback, useState } from 'react';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Select, Space, Tag } from 'antd';
import { BaseBizTable, BaseTableUtils, type Fa, type FaberTable, FaUtils, ShiroPermissionContainer, useApiLoading, useTableQueryParams } from '@fa/ui';
import dayjs from 'dayjs';
import { onlineUserApi } from '@features/fa-admin-pages/services';
import type { OnlineUser } from '@features/fa-admin-pages/types';

const kickPermission = '/admin/system/monitor/onlineUser:kickout';
const formatTime = (value: number | null) => (value == null ? '未知（已有会话）' : dayjs(value).format('YYYY-MM-DD HH:mm:ss'));

export default function OnlineUserList() {
  const [form] = Form.useForm();
  const [stats, setStats] = useState<OnlineUser.Stats>();
  const kicking = useApiLoading(onlineUserApi.getUrl('kickout'));
  const loadPage = useCallback(async (params: Fa.BasePageProps) => {
    const [page, summary] = await Promise.all([onlineUserApi.page(params), onlineUserApi.stats()]);
    setStats(summary.data);
    return page;
  }, []);
  const { setFormValues, handleTableChange, fetchPageList, loading, list, paginationProps } =
    useTableQueryParams<OnlineUser.Session>(loadPage, {}, '在线会话');

  function confirmKickout(record: OnlineUser.Session, allSessions: boolean) {
    Modal.confirm({
      title: allSessions ? '下线该用户全部后台会话？' : '强制下线此会话？',
      content: (
        <div>
          <p>目标用户：{record.name}（{record.username}）</p>
          <p>{allSessions ? '该用户所有后台登录会话将失效。' : '所有共享此会话的浏览器将一起失效。'}</p>
          <p>对方下次请求时返回登录页，仍可重新登录。</p>
        </div>
      ),
      okText: '确认下线',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        const res = await onlineUserApi.kickout(record.id, allSessions);
        FaUtils.showResponse(res, '强制下线');
        fetchPageList();
      },
    });
  }

  function genColumns(): FaberTable.ColumnsProp<OnlineUser.Session>[] {
    // 后端固定按最近访问时间倒序，列不启用服务端尚未支持的排序。
    return [
      { ...BaseTableUtils.genSimpleSorterColumn('账号', 'username', 150, false), render: (_, record) => (
        <Space>{record.username}{record.current && <Tag color="blue">当前会话</Tag>}</Space>
      ) },
      BaseTableUtils.genSimpleSorterColumn('姓名', 'name', 110, false),
      { ...BaseTableUtils.genSimpleSorterColumn('来源', 'source', 90, false), render: () => '后台 Web' },
      { ...BaseTableUtils.genBoolSorterColumn('状态', 'active', 110, false), render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? '近期活跃' : '暂未活跃'}</Tag>
      ) },
      { ...BaseTableUtils.genTimeSorterColumn('登录时间', 'loginTime', 180, false), render: formatTime },
      { ...BaseTableUtils.genTimeSorterColumn('最近访问时间', 'lastAccessTime', 180, false), render: formatTime },
      { ...BaseTableUtils.genSimpleSorterColumn('最近访问 IP', 'ip', 145, false), render: (value: string | null) => value || '-' },
      { ...BaseTableUtils.genSimpleSorterColumn('最近浏览器', 'browser', 120, false), ellipsis: true, render: (value: string | null) => value || '-' },
      { ...BaseTableUtils.genSimpleSorterColumn('最近操作系统', 'os', 125, false), ellipsis: true, render: (value: string | null) => value || '-' },
      { ...BaseTableUtils.genTimeSorterColumn('到期时间', 'expiresAt', 180, false), render: (value: number | null) => value == null ? '永不过期' : formatTime(value) },
      { title: '操作', dataIndex: 'opr', width: 230, fixed: 'right', tcRequired: true, tcType: 'menu', render: (_, record) => (
        <ShiroPermissionContainer permission={kickPermission}>
          <Space>
            <Button size="small" type="link" danger disabled={record.current || kicking} onClick={() => confirmKickout(record, false)}>
              强制下线
            </Button>
            <Button size="small" type="link" danger disabled={record.currentUser || kicking} onClick={() => confirmKickout(record, true)}>
              全部后台下线
            </Button>
          </Space>
        </ShiroPermissionContainer>
      ) },
    ];
  }

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content">
      <div className="fa-flex-row-center fa-p8" style={{ gap: 24, flexWrap: 'wrap' }}>
        <div className="fa-h3">在线用户</div>
        <Space size="large" wrap>
          <span>有效会话 <strong>{stats?.sessionCount ?? '-'}</strong></span>
          <span>在线用户 <strong>{stats?.userCount ?? '-'}</strong></span>
          <span>近期活跃用户 <strong>{stats?.activeUserCount ?? '-'}</strong></span>
        </Space>
      </div>
      <Alert type="info" showIcon title="仅展示后台有效登录会话，关闭浏览器不会立即下线。" description={
        `最近 ${stats ? stats.activeWindowSeconds / 60 : 5} 分钟有认证请求视为活跃，状态可能有短暂延迟。共享会话按一条展示，下线会影响所有共享浏览器。旧会话会在下次请求时纳入统计。`
      } />
      <Form form={form} layout="inline" onFinish={({ active, ...rest }) => setFormValues({
        ...rest, active: active == null ? undefined : active === 'active',
      })} className="fa-p8" style={{ rowGap: 8 }}>
        <Form.Item name="keyword" label="用户">
          <Input placeholder="账号 / 姓名" allowClear maxLength={100} />
        </Form.Item>
        <Form.Item name="source" label="来源">
          <Select placeholder="全部来源" allowClear style={{ width: 120 }} options={[{ value: 'web', label: '后台 Web' }]} />
        </Form.Item>
        <Form.Item name="active" label="状态">
          <Select placeholder="全部状态" allowClear style={{ width: 130 }} options={[
            { value: 'active', label: '近期活跃' }, { value: 'idle', label: '暂未活跃' },
          ]} />
        </Form.Item>
        <Space>
          <Button htmlType="submit" icon={<SearchOutlined />} loading={loading}>查询</Button>
          <Button onClick={() => { form.resetFields(); setFormValues({}); }}>重置</Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchPageList}>刷新</Button>
        </Space>
      </Form>
      <BaseBizTable<OnlineUser.Session>
        biz="base_online_user_v1"
        rowKey="id"
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
