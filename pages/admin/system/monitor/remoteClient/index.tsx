import { ReloadOutlined } from '@ant-design/icons';
import { BaseBizTable, BaseTableUtils, type Fa, type FaberTable, useTableQueryParams } from '@fa/ui';
import useAutoRefresh from '@features/fa-admin-pages/hooks/useAutoRefresh';
import { remoteClientApi } from '@features/fa-admin-pages/services';
import type { RemoteClient } from '@features/fa-admin-pages/types';
import { Alert, Button, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import RemoteLogViewer from './components/RemoteLogViewer';

const formatTime = (value: number | null | undefined) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-');

export default function RemoteClientList() {
  const [selectedClient, setSelectedClient] = useState<RemoteClient.Client>();
  const loadPage = useCallback((params: Fa.BasePageProps) => remoteClientApi.page(params), []);
  const { handleTableChange, fetchPageList, loading, list, paginationProps } = useTableQueryParams<RemoteClient.Client>(loadPage, {}, '在线客户端');
  useAutoRefresh(5, fetchPageList);

  const columns: FaberTable.ColumnsProp<RemoteClient.Client> = [
    { ...BaseTableUtils.genSimpleSorterColumn('账号', 'username', 140, false), render: (_, record) => record.username || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('姓名', 'name', 120, false), render: (_, record) => record.name || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('类别', 'clientType', 100, false), render: (value: string) => <Tag>{value}</Tag> },
    { ...BaseTableUtils.genSimpleSorterColumn('应用', 'appName', 150, false), render: (value: string | null) => value || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('版本', 'release', 100, false), render: (value: string | null) => value || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('运行时', 'runtime', 110, false), render: (value: string | null) => value || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('平台', 'platform', 100, false), render: (value: string | null) => value || '-' },
    { ...BaseTableUtils.genSimpleSorterColumn('设备', 'deviceModel', 150, false), ellipsis: true, render: (value: string | null) => value || '-' },
    { ...BaseTableUtils.genTimeSorterColumn('连接时间', 'connectedAt', 180, false), render: formatTime },
    { ...BaseTableUtils.genTimeSorterColumn('最近心跳', 'lastSeenAt', 180, false), render: formatTime },
    {
      title: '操作',
      dataIndex: 'opr',
      width: 110,
      fixed: 'right',
      tcRequired: true,
      tcType: 'menu',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => setSelectedClient(record)}>
          实时日志
        </Button>
      ),
    },
  ];

  return (
    <div className="fa-full-content-p12 fa-flex-column fa-content">
      <div className="fa-flex-row-center fa-p8" style={{ gap: 24, flexWrap: 'wrap' }}>
        <div className="fa-h3">在线客户端</div>
        <Space>
          <span>
            在线连接 <strong>{paginationProps.total ?? '-'}</strong>
          </span>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchPageList}>
            刷新
          </Button>
        </Space>
      </div>
      <Alert type="info" showIcon title="仅显示已登录且仍有 WebSocket 心跳的客户端；App 进入后台或断开连接后会离线。" />
      <BaseBizTable<RemoteClient.Client>
        biz="base_remote_client_v1"
        rowKey="id"
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
      {selectedClient && <RemoteLogViewer client={selectedClient} onClose={() => setSelectedClient(undefined)} />}
    </div>
  );
}
