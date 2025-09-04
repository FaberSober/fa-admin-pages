import React, { type CSSProperties, useContext, useEffect, useRef, useState } from 'react';
import { fileSaveApi, msgApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@/types';
import { Avatar, Badge, List, Segmented } from 'antd';
import { get } from 'lodash';
import { ApiEffectLayoutContext, FaFlexRestLayout } from '@fa/ui';
import UserLayoutContext from '../../user/context/UserLayoutContext';
import MenuLayoutContext from '../context/MenuLayoutContext';
import { AppstoreOutlined, AuditOutlined, SettingOutlined } from '@ant-design/icons';
import { FaApiScrollList, FaApiScrollListRef } from '@/components';

interface MsgListProps {
  onClose?: () => void;
}

/**
 * 消息列表
 * @param onClose
 * @constructor
 */
export default function MsgList({ onClose }: MsgListProps) {
  const scrollListRef = useRef<FaApiScrollListRef>(null);
  const [tab, setTab] = useState('all');
  const { loadingEffect } = useContext(ApiEffectLayoutContext);

  const { unreadCount, refreshUnreadCount } = useContext(UserLayoutContext);
  const { addTab } = useContext(MenuLayoutContext);

  const [data, setData] = useState<Admin.Msg[]>([]);

  useEffect(() => {
    fetchMsgList();
  }, [unreadCount]);

  function fetchMsgList() {
    msgApi.pageMine({ pageSize: 10, query: { isRead: false }, sorter: 'id DESC' }).then((res) => {
      setData(res.data.rows);
      refreshUnreadCount();
    });
  }

  function handleReadOne(id: string) {
    msgApi.batchRead([id]).then(() => {
      refreshUnreadCount();
      scrollListRef.current?.refresh();
      // fetchMsgList();
    });
  }

  function handleOpenMsgTag() {
    addTab({
      key: 'msg',
      path: '/admin/system/account/msg',
      name: '消息中心',
    });
    if (onClose) onClose();
  }

  const bottomLink: CSSProperties = {
    width: '100%',
    padding: '12px 0',
    textAlign: 'center',
    display: 'inline-block',
    borderTop: '1px solid #eee',
  };

  const loading = loadingEffect[msgApi.getUrl('pageMine')];
  return (
    <div className='fa-full-content-p12 fa-flex-column'>
      <div className='fa-mb12'>
        <Segmented
          options={[
            { label: '全部', value: 'all', icon: <AppstoreOutlined /> },
            { label: '流程', value: '2', icon: <SettingOutlined /> },
            { label: '系统', value: '1', icon: <AuditOutlined /> },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      <FaFlexRestLayout>
        <FaApiScrollList
          ref={scrollListRef}
          apiPage={(params) => msgApi.pageMine({ ...params, query: { isRead: false }, sorter: 'id DESC' })}
          renderItem={(item: Admin.Msg) => (
            <div key={item.id} className='fa-border-b fa-p12 fa-flex-row-center fa-hover'>
              <Avatar size="small" src={fileSaveApi.genLocalGetFilePreview(get(item, 'fromUser.img')!)} />

              <div onClick={() => handleReadOne(item.id)} className='fa-ml12 fa-flex-1 fa-break-word'>
                {get(item, 'content')}
              </div>
              {!item.isRead && <Badge status="success" style={{margin: '0 6px'}} />}
              <div>{item.crtTime}</div>
            </div>
          )}
        />

        {/* <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar size="small" src={fileSaveApi.genLocalGetFilePreview(get(item, 'fromUser.img')!)} />}
                title={<a onClick={() => handleReadOne(item.id)}>{get(item, 'content')}</a>}
                // description={get(item, 'content')}
              />
            </List.Item>
          )}
          loading={loading}
        />
        <a onClick={handleOpenMsgTag} style={bottomLink}>
          查看更多
        </a> */}
      </FaFlexRestLayout>
    </div>
  );
}
