import React, { useContext, useMemo } from 'react';
import { LogoutOutlined, MessageOutlined, SecurityScanOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Menu, Popover } from 'antd';
import { useIntl } from 'react-intl';
import { fileSaveApi } from '@fa/ui';
import { useNavigate } from 'react-router-dom';
import { LangContext, UserLayoutContext } from "@fa-admin-pages/layout";

const UserPopoverContent = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const { setColorPrimary } = useContext(LangContext);
  const { logout } = useContext(UserLayoutContext);

  // 头像下拉弹框-菜单点击
  function handleHeadDropdownClick(key: string) {
    // FIXME: 这里打开个人中心菜单后，需要在tabBar中打开对于的标签页
    switch (key) {
      case 'base':
        navigate('/admin/system/account/base');
        break;
      case 'security':
        navigate('/admin/system/account/security');
        break;
      case 'msg':
        navigate('/admin/system/account/msg');
        break;
      case 'logout':
        logout();
        break;
    }
  }

  const items = useMemo(
    () => [
      {
        label: intl.formatMessage({ id: 'menu.account.center' }),
        key: 'base',
        icon: <UserOutlined />,
      },
      {
        label: intl.formatMessage({ id: 'menu.account.security' }),
        key: 'security',
        icon: <SecurityScanOutlined />,
      },
      {
        label: intl.formatMessage({ id: 'menu.account.msg' }),
        key: 'msg',
        icon: <MessageOutlined />,
      },
      {
        label: intl.formatMessage({ id: 'menu.account.logout' }),
        key: 'logout',
        icon: <LogoutOutlined />,
      },
    ],
    [],
  );

  function handleChangeThemeColor(color: string) {
    // set antd theme primary color
    setColorPrimary(color);

    // set css theme color
    const rootDom = document.getElementsByTagName('body')[0].style;
    rootDom.setProperty('--primary-color', color);
  }

  return (
    <div style={{ minWidth: 160 }}>
      <div className="fa-flex-row-center">
        {['#F5222D', '#faad14', '#d4b106', '#52c41a', '#1677ff', '#a8071a', '#722ED1'].map((i) => (
          <div key={i} style={{ width: 25, height: 25, background: i }} onClick={() => handleChangeThemeColor(i)} />
        ))}
      </div>
      <Menu selectedKeys={[]} onClick={(menu) => handleHeadDropdownClick(menu.key)} items={items} style={{ border: 'none' }} />
    </div>
  );
};

/**
 * 用户头像+用户名
 */
export default function UserAvatar() {
  const { user } = useContext(UserLayoutContext);
  return (
    <Popover
      placement="bottomRight"
      content={<UserPopoverContent />}
      trigger="click"
      getPopupContainer={() => document.body}
      overlayInnerStyle={{ padding: 0 }}
    >
      <div style={{ padding: '0 12px', cursor: 'pointer', display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Avatar size="small" src={user ? fileSaveApi.genLocalGetFilePreview(user.img) : ''} />
        <span style={{ color: '#eee', marginLeft: 12 }}>{user?.name}</span>
      </div>
    </Popover>
  );
}
