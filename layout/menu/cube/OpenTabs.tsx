import React, { useContext } from 'react';
import { Tabs } from 'antd';
import MenuLayoutContext from "../context/MenuLayoutContext";

/**
 * @author xu.pengfei
 * @date 2022/9/23
 */
export default function OpenTabs() {
  const { openTabs, setOpenTabs, menuSelMenuId, setMenuSelMenuId } = useContext(MenuLayoutContext);

  const remove = (targetKey: string) => {
    let newActiveKey = menuSelMenuId;
    let lastIndex = -1;
    openTabs.forEach((item, i) => {
      if (item.id === targetKey) {
        lastIndex = i - 1;
      }
    });
    const newPanes = openTabs.filter((item) => item.id !== targetKey);
    if (newPanes.length && newActiveKey === targetKey) {
      if (lastIndex >= 0) {
        newActiveKey = newPanes[lastIndex].id;
      } else {
        newActiveKey = newPanes[0].id;
      }
    }
    setOpenTabs(newPanes);
    setMenuSelMenuId(newActiveKey);
  };

  const items = openTabs.map((i) => ({
    key: i.id,
    label: i.name,
  }));
  return (
    <Tabs
      hideAdd
      type="editable-card"
      activeKey={menuSelMenuId}
      onChange={(e) => setMenuSelMenuId(e)}
      onEdit={(targetKey:any) => remove(targetKey)}
      items={items}
    />
  );
}