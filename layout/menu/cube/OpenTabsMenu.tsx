import { CloseOutlined, CloseSquareOutlined, LeftSquareOutlined, PushpinOutlined, ReloadOutlined, RightSquareOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Divider } from 'antd';
import React, { useContext } from 'react';
import { findIndex } from 'lodash';
import MenuLayoutContext from '../context/MenuLayoutContext';

export interface OpenTabsMenuProps {
  targetTabKey: string;
}

/**
 * @author xu.pengfei
 * @date 2026-03-03 16:01:06
 */
export default function OpenTabsMenu({ targetTabKey }: OpenTabsMenuProps) {
  const { openTabs, closeTabs, reloadTab } = useContext(MenuLayoutContext);

  function remove(tabKey: string) {
    closeTabs?.([tabKey]);
  }

  function closeOthers(tabKey: string) {
    const index = findIndex(openTabs, (i) => i.key === tabKey);
    if (index === -1) return;

    const newPanes = openTabs.filter((item) => item.key === tabKey);
    closeTabs?.(openTabs.filter(item => !newPanes.some(tab => tab.key === item.key)).map(item => item.key));
  }

  function closeLeft(tabKey: string) {
    const index = findIndex(openTabs, (i) => i.key === tabKey);
    if (index === -1) return;

    const newPanes = [...openTabs];
    newPanes.splice(0, index);
    closeTabs?.(openTabs.filter(item => !newPanes.some(tab => tab.key === item.key)).map(item => item.key));
  }

  function closeRight(tabKey: string) {
    const index = findIndex(openTabs, (i) => i.key === tabKey);
    if (index === -1) return;

    const newPanes = [...openTabs];
    newPanes.splice(index + 1, newPanes.length - index - 1);
    closeTabs?.(openTabs.filter(item => !newPanes.some(tab => tab.key === item.key)).map(item => item.key));
  }

  function reload() {
    reloadTab(targetTabKey);
  }

  function openAnotherWindow() {
    window.open(window.location.href, '_blank')
  }

  return (
    <div className='fa-menu-tab-context-menu'>
      <Button type='text' block icon={<CloseOutlined />} onClick={() => remove(targetTabKey)}>关闭</Button>
      {/* <Button type='text' block icon={<PushpinOutlined />} onClick={() => reload()}>固定</Button> */}
      <Button type='text' block icon={<ReloadOutlined />} onClick={() => reload()}>重新加载</Button>
      <Button type='text' block icon={<SendOutlined />} onClick={() => openAnotherWindow()}>在新窗口打开</Button>
      <Divider />
      <Button type='text' block icon={<LeftSquareOutlined />} onClick={() => closeLeft(targetTabKey)}>关闭左侧</Button>
      <Button type='text' block icon={<RightSquareOutlined />} onClick={() => closeRight(targetTabKey)}>关闭右侧</Button>
      <Button type='text' block icon={<CloseSquareOutlined />} onClick={() => closeOthers(targetTabKey)}>关闭其他</Button>
    </div>
  );
}

export function useTabOperations() {
  const { closeTabs } = useContext(MenuLayoutContext);
  return { remove: (tabKey: string) => closeTabs?.([tabKey]) };
}
