import React, { CSSProperties, useContext, useEffect, useState } from 'react';
import { fileSaveApi, msgApi } from '@/services';
import { Admin } from '@/types';
import { Avatar, Badge, List, Popover } from 'antd';
import { get } from 'lodash';
import { BellOutlined } from '@ant-design/icons';
import { ApiEffectLayoutContext } from "@fa/ui";
import { UserLayoutContext } from '../../user/UserLayout'
import MenuLayoutContext from "../context/MenuLayoutContext";


interface MsgListProps {
  onClose?: () => void;
}

function MsgList({ onClose }: MsgListProps) {
  const {loadingEffect} = useContext(ApiEffectLayoutContext)

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
      // fetchMsgList();
    });
  }

  function handleOpenMsgTag() {
    addTab({
      key: 'msg',
      path: '/admin/system/account/msg',
      name: '消息中心',
    })
    if (onClose) onClose()
  }

  const bottomLink: CSSProperties = {
    width: '100%',
    padding: '12px 0',
    textAlign: 'center',
    display: 'inline-block',
    borderTop: '1px solid #eee',
  };

  const loading = loadingEffect[msgApi.getUrl('pageMine')]
  return (
    <div style={{ width: 400, maxHeight: 400, overflowY: 'auto', padding: '0 12px' }}>
      <List
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
      </a>
    </div>
  );
}

/**
 * 个人消息提示Badge
 * @author xu.pengfei
 * @date 2021/1/7
 */
export default function MsgBadgeCube() {
  const { unreadCount } = useContext(UserLayoutContext);
  const [open, setOpen] = useState(false)

  return (
    <Popover
      placement="bottomRight"
      content={<MsgList onClose={() => setOpen(false)} />}
      trigger="click"
      overlayInnerStyle={{padding: 0}}
      open={open}
      onOpenChange={setOpen}
    >
      <div className="fa-link-grey fa-flex-center" style={{ width: 44 }}>
        <a className="fa-menu-normal-cube">
          <Badge size="small" count={unreadCount}>
            <BellOutlined className="fa-menu-normal-cube" style={{ margin: '0 4px' }} />
          </Badge>
        </a>
      </div>
    </Popover>
  );
}
