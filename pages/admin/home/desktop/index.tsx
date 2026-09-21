import { useState } from 'react';
import * as cubes from '@/cubes/homecubes';
import { Alert, Button, FloatButton, Space, Spin } from 'antd';
import { BaseDrawer, FaFlashCard, FaUtils } from '@fa/ui';
import { EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import ExportAndImportBtn from '@features/fa-admin-pages/components/utils/ExportAndImportBtn';
import { FaGridLayout } from '@features/fa-admin-pages/components/grid/FaGridLayout';
import { FaGridLayoutUtils } from '@features/fa-admin-pages/components/utils';
import FaCubeGrid from '@features/fa-admin-pages/components/cube/FaCubeGrid';
import type { Layout } from 'react-grid-layout';

const biz = 'HOME_LAYOUT';
const type = 'LAYOUT';
const defaultCubeIds = ['HelloBanner', 'AdminNoticeCube', 'AlertHomeCube'];

/** 将发布前保存的 16 列全局首页默认布局适配到当前 24 列网格。 */
function normalizeLegacyGlobalLayout(layout: Layout): Layout {
  const banner = layout.find((item) => item.i === 'HelloBanner');
  const notice = layout.find((item) => item.i === 'AdminNoticeCube');
  const alert = layout.find((item) => item.i === 'AlertHomeCube');

  const isLegacyDefault =
    banner?.x === 0 && banner.w === 16 && notice?.x === 0 && notice.w === 8 && alert?.x === 8 && alert.w === 8;

  return isLegacyDefault ? layout.map((item) => ({ ...item, x: (item.x * 3) / 2, w: (item.w * 3) / 2 })) : layout;
}

/**
 * 工作台
 * @author xu.pengfei
 * @date 2023/1/3 16:13
 */
export default function Desktop() {
  const defaultLayout = FaGridLayoutUtils.createDefaultLayout(cubes as any, defaultCubeIds);
  const { layout, initializing, initializationError, saveError, loading, retryInitialization, retryLayout, onLayoutChange, handleAdd, handleDel, handleSaveCurAsDefault, handleClearAllUserConfig } = FaGridLayoutUtils.useGridLayoutConfig(
    cubes,
    biz,
    type,
    defaultLayout,
    normalizeLegacyGlobalLayout,
  );

  const { allLayout } = FaGridLayoutUtils.useAllLayout(cubes as any);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);

  const inIds: string[] = layout.map((i) => i.i);
  const availableCubeIds = new Set(allLayout.map((item) => item.i));

  if (initializing || initializationError) {
    return (
      <div className="fa-full-content-p12">
        {initializing ? <Spin tip="正在加载工作台..." /> : <Alert type="error" showIcon title="工作台加载失败" description="请重试，加载成功后再进行布局调整。" action={<Button onClick={retryInitialization}>重试</Button>} />}
      </div>
    );
  }

  return (
    <div className="fa-full-content-p12">
      {saveError && <Alert type="error" showIcon title="工作台布局保存失败" description="当前调整尚未成功保存，请重试。" action={<Button onClick={retryLayout}>重试</Button>} style={{ marginBottom: 12 }} />}
      <Spin spinning={loading}>
        <FaGridLayout
          layout={layout}
          renderItem={(i) => {
            const Component = (cubes as any)[i.i];
            if (Component && availableCubeIds.has(i.i)) {
              return (
                <FaFlashCard title={Component.title} titleRender={Component.titleRender} hideTitle={!Component.showTitle}>
                  <Component />
                </FaFlashCard>
              );
            }
            return <FaFlashCard>组件 {i.i} 当前不可用</FaFlashCard>;
          }}
          onLayoutChange={onLayoutChange}
          rowHeight={20}
          cols={24}
          isDraggable={editing}
          isResizable={editing}
        />
      </Spin>
      <div style={{ height: 12, width: '100%' }} />

      <BaseDrawer open={open} title="添加组件" bodyStyle={{ padding: 0 }} onClose={() => setOpen(false)}>
        <Space className="fa-p12" wrap>
          <Button onClick={() => onLayoutChange([])}>清空</Button>
          <Button onClick={handleSaveCurAsDefault}>保存当前为默认</Button>
          <Button onClick={handleClearAllUserConfig} danger>清空全部用户缓存</Button>
          <ExportAndImportBtn filename="工作台" layout={FaUtils.tryFormatJson(JSON.stringify(layout))} allowedIds={Object.keys(cubes)} onUpload={onLayoutChange} />
        </Space>
        <FaCubeGrid
          allLayout={allLayout}
          cubes={cubes as any}
          selectedIds={inIds}
          onAdd={handleAdd}
          onRemove={handleDel}
        />
      </BaseDrawer>

      <FloatButton.Group shape="square">
        <FloatButton icon={<PlusOutlined />} onClick={() => setOpen(true)} />
        <FloatButton onClick={() => setEditing(!editing)} icon={editing ? <SaveOutlined /> : <EditOutlined />} />
      </FloatButton.Group>
    </div>
  );
}
