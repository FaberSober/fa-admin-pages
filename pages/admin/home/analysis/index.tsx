import React, {useState} from 'react';
import * as cubes from '@/cubes/analysiscubes'
import { FaCodeEditModal, FaGridLayout, FaGridLayoutUtils } from "@/components";
import {isNil} from "lodash";
import {Button, List, Space, Spin, Switch} from "antd";
import {BaseDrawer, FaFlashCard, FaUtils} from "@fa/ui";
import {LoadingOutlined, PlusOutlined} from "@ant-design/icons";


const biz = "HOME_ANALYSIS_LAYOUT";
const type = "LAYOUT";

/**
 * 工作台
 * @author xu.pengfei
 * @date 2023/1/3 16:13
 */
export default function Analysis() {
  const {layout, loading, onLayoutChange, handleAdd, handleDel, handleSaveCurAsDefault, handleClearAllUserConfig} = FaGridLayoutUtils.useGridLayoutConfig(cubes, biz, type, []);

  const {allLayout} = FaGridLayoutUtils.useAllLayout(cubes)
  const [editing, setEditing] = useState(false)

  const inIds: string[] = layout.map(i => i.i);
  return (
    <div className="fa-full-content">
      <FaGridLayout
        layout={layout}
        renderItem={i => {
          const Component = (cubes as any)[i.i];
          if (Component) {
            // if (!Component.showTitle) {
            //   return <Component />
            // }
            return (
              <FaFlashCard title={Component.title} hideTitle={!Component.showTitle}>
                <Component/>
              </FaFlashCard>
            )
          }
          return <span>Component {i.i} Not Found</span>
        }}
        onLayoutChange={onLayoutChange}
        rowHeight={20}
        cols={16}
        isDraggable={editing}
        isResizable={editing}
      />

      <Space style={{position: 'absolute', top: 12, right: 12}}>
        {loading && <Spin indicator={<LoadingOutlined style={{fontSize: 24}} spin/>}/>}

        <BaseDrawer
          title="添加组件"
          triggerDom={<Button shape="circle" icon={<PlusOutlined/>} size="small"/>}
          bodyStyle={{padding: 0}}
        >
          <Space>
            <Button onClick={() => onLayoutChange([])}>清空</Button>
            <Button onClick={handleSaveCurAsDefault}>保存当前为默认</Button>
            <Button onClick={handleClearAllUserConfig} danger>清空全部用户缓存</Button>
            <FaCodeEditModal value={FaUtils.tryFormatJson(JSON.stringify(layout))} onChange={v => onLayoutChange(JSON.parse(v))}>
              <Button>编辑配置</Button>
            </FaCodeEditModal>
          </Space>
          <List
            itemLayout="horizontal"
            dataSource={allLayout}
            size="small"
            renderItem={(item) => {
              const Component = (cubes as any)[item.i];
              if (isNil(Component)) {
                return null;
              }
              const sel = inIds.indexOf(item.i) > -1
              return (
                <List.Item
                  extra={(
                    <div>
                      {!sel && <a onClick={() => handleAdd(item.i)} key="list-item-add">添加</a>}
                      {sel && <a onClick={() => handleDel(item.i)} key="list-item-del" style={{color: '#F00'}}>移除</a>}
                    </div>
                  )}
                >
                  <List.Item.Meta
                    title={<a onClick={() => handleAdd(item.i)}>{Component.title}</a>}
                    description={Component.description}
                  />
                </List.Item>
              )
            }}
          />
        </BaseDrawer>
        <Switch checkedChildren="退出编辑" unCheckedChildren="编辑布局" checked={editing} onChange={(e) => setEditing(e)}/>
      </Space>
    </div>
  )
}
