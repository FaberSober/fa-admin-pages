import React, { useContext } from 'react';
import { Tabs } from 'antd';
import MenuLayoutContext from "../context/MenuLayoutContext";

/**
 * @author xu.pengfei
 * @date 2022/9/23
 */
export default function OpenTabs() {
  const { openTabs, curTab, setOpenTabs, selTab } = useContext(MenuLayoutContext);

  const remove = (targetKey: string) => {
    // 0. remove key
    let lastIndex = -1;
    openTabs.forEach((item, i) => {
      if (item.key === targetKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = openTabs.filter((item) => item.key !== targetKey);

    // 1. decide slide to new tab
    let newActiveKey = curTab?.key;
    if (newPanes.length && newPanes.length > 0 && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].key;
      } else {
        newActiveKey = newPanes[0].key;
      }
      selTab(newActiveKey);
    }
    setOpenTabs(newPanes);
  };

  const items = openTabs.map((i) => ({
    key: i.key,
    label: (
      <span>
        <span>{i.icon}</span>
        <span>{i.name}</span>
      </span>
    ),
    closable: i.closeable,
  }));
  return (
    <Tabs
      hideAdd
      type="editable-card"
      activeKey={curTab?.key}
      onChange={(key:string) => selTab(key)}
      onEdit={(targetKey:any) => remove(targetKey)}
      items={items}
    />
  );
}
