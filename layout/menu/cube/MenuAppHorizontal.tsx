import React, { useContext } from 'react';
import { Menu } from 'antd';
import { FaEnums } from '@fa/ui';
import { FaIcon } from '@fa/icons';
import MenuLayoutContext from '../context/MenuLayoutContext';
import {LangContext} from "@features/fa-admin-pages/layout";

/**
 * 顶部水平的菜单
 * @author xu.pengfei
 * @date 2022/9/23
 */
export default function MenuAppHorizontal() {
  const {themeDark} = useContext(LangContext)
  const { menuFullTree, menuSelAppId, setMenuSelAppId } = useContext(MenuLayoutContext);

  const blocks = menuFullTree.filter((i) => i.sourceData.level === FaEnums.RbacMenuLevelEnum.APP);
  const items = blocks.map((i) => ({
    key: i.id,
    label: i.name,
    icon: i.sourceData.icon ? (
      <div className="fa-flex-column-center" style={{ width: 20, display: 'inline-block' }}>
        <FaIcon icon={i.sourceData.icon} />
      </div>
    ) : null,
  }));
  return (
    <Menu
      className="fa-menu-top"
      mode="horizontal"
      theme={themeDark ? 'dark' : 'light'}
      items={items}
      selectedKeys={menuSelAppId ? [menuSelAppId] : []}
      onSelect={({ key }) => setMenuSelAppId(key)}
      style={{ flex: 1, border: 'none' }}
    />
  );
}
