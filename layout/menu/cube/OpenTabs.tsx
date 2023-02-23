import React, { useContext } from 'react';
import { Tabs } from 'antd';
import { Item, ItemParams, Menu, useContextMenu } from 'react-contexify';
import MenuLayoutContext, { OpenTabsItem } from "../context/MenuLayoutContext";
import './OpenTabs.scss'
import { findIndex } from "lodash";
import { FaFullscreenBtn } from "@fa/ui";


/**
 * @author xu.pengfei
 * @date 2022/9/23
 */
export default function OpenTabs() {
  const { openTabs, curTab, setOpenTabs, selTab } = useContext(MenuLayoutContext);

  // ------------------------------- tab operations -------------------------------
  /**
   * 关闭指定标签
   * @param tabKey
   */
  function remove(tabKey: string) {
    const index = findIndex(openTabs, i => i.key === tabKey)
    if (index === -1) return;

    // 0. remove key
    let lastIndex = -1;
    openTabs.forEach((item, i) => {
      if (item.key === tabKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = openTabs.filter((item) => item.key !== tabKey);

    // 1. decide slide to new tab
    let newActiveKey = curTab?.key;
    if (newPanes.length && newPanes.length > 0 && newActiveKey === tabKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
      selTab(newActiveKey);
    }
    setOpenTabs(newPanes);
  };

  /**
   * 关闭其他标签页
   * @param tabKey
   */
  function closeOthers(tabKey: string) {
    const index = findIndex(openTabs, i => i.key === tabKey)
    if (index === -1) return;

    const newPanes = openTabs.filter((item) => item.key === tabKey);
    setOpenTabs(newPanes);
  }

  /**
   * 关闭左侧标签
   * @param tabKey
   */
  function closeLeft(tabKey: string) {
    const index = findIndex(openTabs, i => i.key === tabKey)
    if (index === -1) return;

    const newPanes = [...openTabs]
    newPanes.splice(0, index)
    setOpenTabs(newPanes);
  }

  /**
   * 关闭右侧标签
   * @param tabKey
   */
  function closeRight(tabKey: string) {
    const index = findIndex(openTabs, i => i.key === tabKey)
    if (index === -1) return;

    const newPanes = [...openTabs]
    newPanes.splice(index + 1, newPanes.length - index - 1)
    setOpenTabs(newPanes);
  }

  // ------------------------------- context menu -------------------------------
  const { show } = useContextMenu({
    id: 'menu_context_tab_item',
  });

  function handleContextMenu(event: any, props: OpenTabsItem) {
    show({ event, props });
  }

  const handleItemClick = ({ id, props }: ItemParams) => {
    const item = props as OpenTabsItem;
    switch (id) {
      case 'menu_close_current':
        remove(item.key)
        break;
      case 'menu_close_other':
        closeOthers(item.key)
        break;
      case 'menu_close_left':
        closeLeft(item.key)
        break;
      case 'menu_close_right':
        closeRight(item.key)
        break;
    }
  };

  // ------------------------------- tab items -------------------------------
  const items = openTabs.map((i) => ({
    key: i.key,
    label: (
      <div className="fa-open-tabs-item-title-div" onContextMenu={(e) => handleContextMenu(e, i)}>
        {/*<span>{i.icon}</span>*/}
        <span>{i.name}</span>
      </div>
    ),
    closable: i.closeable,
  }));

  return (
    <div className="fa-menu-open-tabs">
      <Tabs
        hideAdd
        type="editable-card"
        activeKey={curTab?.key}
        onChange={(key:string) => selTab(key)}
        onEdit={(targetKey:any) => remove(targetKey)}
        items={items}
        className="fa-tab"
      />

      <FaFullscreenBtn target={document.body} />

      <Menu id='menu_context_tab_item' className="contextMenu">
        <Item id="menu_close_current" onClick={handleItemClick}>关闭当前</Item>
        <Item id="menu_close_other" onClick={handleItemClick}>关闭其他</Item>
        <Item id="menu_close_left" onClick={handleItemClick}>关闭左边</Item>
        <Item id="menu_close_right" onClick={handleItemClick}>关闭右边</Item>
      </Menu>
    </div>
  );
}
