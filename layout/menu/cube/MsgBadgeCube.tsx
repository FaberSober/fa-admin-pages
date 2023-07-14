import React, { CSSProperties, useContext, useEffect, useState } from 'react';
import { fileSaveApi, msgApi } from '@/services';
import { Admin } from '@/types';
import { Avatar, Badge, List, Popover } from 'antd';
import { get } from 'lodash';
import { BellOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { UserLayoutContext } from "@/layout";

function MsgList() {
  const { unreadCount, refreshUnreadCount } = useContext(UserLayoutContext);

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

  const bottomLink: CSSProperties = {
    width: '100%',
    padding: '12px 0',
    textAlign: 'center',
    display: 'inline-block',
    borderTop: '1px solid #eee',
  };

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
      />
      <Link to="/admin/system/account/msg" style={bottomLink}>
        查看更多
      </Link>
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

  return (
    <Popover placement="bottomRight" content={<MsgList />} trigger="click" overlayInnerStyle={{padding: 0}}>
      <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <a>
          <Badge size="small" count={unreadCount}>
            <BellOutlined style={{ margin: '0 4px' }} />
          </Badge>
        </a>
      </div>
    </Popover>
  );
}
