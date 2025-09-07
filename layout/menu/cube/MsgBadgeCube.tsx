import React, { useContext, useState } from 'react';
import { Badge, notification, Tooltip } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import UserLayoutContext from '../../user/context/UserLayoutContext';
import useBus from 'use-bus';
import MsgList from './MsgList';
import { BaseDrawer } from '@fa/ui';

/**
 * 个人消息提示Badge
 * @author xu.pengfei
 * @date 2021/1/7
 */
export default function MsgBadgeCube() {
  const { unreadCount, refreshUnreadCount } = useContext(UserLayoutContext);
  const [api, contextHolder] = notification.useNotification();

  // receive plain message from websocket
  useBus(
    ['@@ws/RECEIVE/PLAIN_MSG'],
    ({ type, payload }) => {
      console.log(type, payload);
      api.open({
        message: '通知',
        description: payload.content,
        showProgress: true,
        pauseOnHover: true,
      });
      refreshUnreadCount();
    },
    [],
  );

  return (
    <>
      {contextHolder}
      <BaseDrawer
        title="系统消息"
        triggerDom={(
          <Tooltip title="系统消息">
            <div className="fa-link-grey fa-flex-center" style={{ width: 44 }}>
              <a className="fa-menu-normal-cube">
                <Badge size="small" count={unreadCount}>
                  <BellOutlined className="fa-menu-normal-cube" style={{ margin: '0 4px' }} />
                </Badge>
              </a>
            </div>
          </Tooltip>
        )}
      >
        <MsgList />
      </BaseDrawer>
    </>
  );
}
