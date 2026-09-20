import {
  IdcardOutlined,
  LogoutOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { UserAppearanceSettings } from '@features/fa-admin-pages/components/settings';
import { fileSaveApi } from '@features/fa-admin-pages/services';
import { Avatar, Menu, Popover } from 'antd';
import { useContext, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import UserLayoutContext from '../../user/context/UserLayoutContext';
import MenuLayoutContext from '../context/MenuLayoutContext';
import './UserAvatar.scss';

interface UserPopoverContentProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

const UserPopoverContent = ({ onClose, onOpenSettings }: UserPopoverContentProps) => {
  const intl = useIntl();
  const { logout, user } = useContext(UserLayoutContext);
  const { addTab } = useContext(MenuLayoutContext);
  const displayName = user.name || user.username || '-';

  // 头像下拉弹框-菜单点击
  function handleHeadDropdownClick(key: string) {
    onClose();
    // FIX-ME: 这里打开个人中心菜单后，需要在tabBar中打开对于的标签页
    switch (key) {
      case 'base':
        addTab({
          key: key,
          path: '/admin/system/account/base',
          name: intl.formatMessage({ id: 'menu.account.center' }),
        });
        break;
      case 'security':
        addTab({
          key: key,
          path: '/admin/system/account/security',
          name: intl.formatMessage({ id: 'menu.account.security' }),
        });
        break;
      case 'msg':
        addTab({
          key: key,
          path: '/admin/system/account/msg',
          name: intl.formatMessage({ id: 'menu.account.msg' }),
        });
        break;
      case 'settings':
        onOpenSettings();
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
        label: intl.formatMessage({ id: 'menu.account.settings' }),
        key: 'settings',
        icon: <SettingOutlined />,
      },
      {
        label: intl.formatMessage({ id: 'menu.account.logout' }),
        key: 'logout',
        icon: <LogoutOutlined />,
      },
    ],
    [intl],
  );

  return (
    <div className="fa-user-popover">
      <div className="fa-user-popover__profile">
        <div className="fa-user-avatar-big">
          <Avatar size={56} src={user.img ? fileSaveApi.genLocalGetFilePreview(user.img) : undefined} alt={displayName}>
            {displayName.slice(0, 1)}
          </Avatar>
          <div className="fa-user-online-badge" />
        </div>
        <div className="fa-user-popover__identity">
          <div className="fa-user-popover__name-row">
            <div className="fa-user-popover__name" title={displayName}>
              {displayName}
            </div>
            <span className="fa-user-popover__status">
              <span className="fa-user-popover__status-dot" aria-hidden="true" />
              在线
            </span>
          </div>
          <div className="fa-user-popover__subtitle">{user.roleNames || user.departmentName || '系统用户'}</div>
        </div>
      </div>
      <div className="fa-user-popover__details">
        <div className="fa-user-popover__detail">
          <IdcardOutlined className="fa-user-popover__detail-icon" aria-hidden="true" />
          <span className="fa-user-popover__detail-label">账户</span>
          <span className="fa-user-popover__detail-value" title={user.username || undefined}>
            {user.username || '未设置'}
          </span>
        </div>
        <div className="fa-user-popover__detail">
          <PhoneOutlined className="fa-user-popover__detail-icon" aria-hidden="true" />
          <span className="fa-user-popover__detail-label">手机</span>
          <span className="fa-user-popover__detail-value" title={user.tel || undefined}>
            {user.tel || '未设置'}
          </span>
        </div>
        <div className="fa-user-popover__detail">
          <MailOutlined className="fa-user-popover__detail-icon" aria-hidden="true" />
          <span className="fa-user-popover__detail-label">邮箱</span>
          <span className="fa-user-popover__detail-value" title={user.email || undefined}>
            {user.email || '未设置'}
          </span>
        </div>
      </div>
      <Menu className="fa-user-popover__menu" selectedKeys={[]} onClick={(menu) => handleHeadDropdownClick(menu.key)} items={items} />
    </div>
  );
};

/**
 * 用户头像+用户名
 */
export default function UserAvatar() {
  const { user } = useContext(UserLayoutContext);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const displayName = user.name || user.username || '-';

  return (
    <>
      <Popover
        placement="bottom"
        trigger="click"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        content={<UserPopoverContent onClose={() => setPopoverOpen(false)} onOpenSettings={() => setSettingsOpen(true)} />}
        getPopupContainer={() => document.body}
        styles={{
          container: {
            padding: 0,
          },
        }}
      >
        <div className="fa-user-avatar">
          <Avatar size={32} src={user.img ? fileSaveApi.genLocalGetFilePreview(user.img) : undefined} alt={displayName}>
            {displayName.slice(0, 1)}
          </Avatar>
          <div className="fa-user-online-badge" />
          {/* <span style={{ marginLeft: 12 }}>{user?.name}</span> */}
        </div>
      </Popover>
      <UserAppearanceSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
