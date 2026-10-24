import { CloseOutlined, CloseSquareOutlined, LeftSquareOutlined, ReloadOutlined, RightSquareOutlined, SendOutlined } from '@ant-design/icons';
import { Button, Divider } from 'antd';
import { useContext } from 'react';
import MenuLayoutContext from '../context/MenuLayoutContext';
import { getTabCloseKeys } from '../tabPolicy';

export interface OpenTabsMenuProps {
  targetTabKey: string;
}

/**
 * @author xu.pengfei
 * @date 2026-03-03 16:01:06
 */
export default function OpenTabsMenu({ targetTabKey }: OpenTabsMenuProps) {
  const { openTabs, closeTabs, reloadTab } = useContext(MenuLayoutContext);

  const currentKeys = getTabCloseKeys(openTabs, targetTabKey, 'current');
  const leftKeys = getTabCloseKeys(openTabs, targetTabKey, 'left');
  const rightKeys = getTabCloseKeys(openTabs, targetTabKey, 'right');
  const otherKeys = getTabCloseKeys(openTabs, targetTabKey, 'others');

  function reload() {
    reloadTab(targetTabKey);
  }

  function openAnotherWindow() {
    window.open(window.location.href, '_blank');
  }

  return (
    <div className="fa-menu-tab-context-menu">
      <Button type="text" block disabled={!currentKeys.length} icon={<CloseOutlined />} onClick={() => closeTabs?.(currentKeys)}>
        关闭
      </Button>
      <Button type="text" block icon={<ReloadOutlined />} onClick={() => reload()}>
        重新加载
      </Button>
      <Button type="text" block icon={<SendOutlined />} onClick={() => openAnotherWindow()}>
        在新窗口打开
      </Button>
      <Divider />
      <Button type="text" block disabled={!leftKeys.length} icon={<LeftSquareOutlined />} onClick={() => closeTabs?.(leftKeys)}>
        关闭左侧
      </Button>
      <Button type="text" block disabled={!rightKeys.length} icon={<RightSquareOutlined />} onClick={() => closeTabs?.(rightKeys)}>
        关闭右侧
      </Button>
      <Button type="text" block disabled={!otherKeys.length} icon={<CloseSquareOutlined />} onClick={() => closeTabs?.(otherKeys)}>
        关闭其他
      </Button>
    </div>
  );
}

export function useTabOperations() {
  const { closeTabs } = useContext(MenuLayoutContext);
  return { remove: (tabKey: string) => closeTabs?.([tabKey]) };
}
