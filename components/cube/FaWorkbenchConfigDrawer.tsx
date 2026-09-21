import { BaseDrawer, FaUtils } from '@fa/ui';
import ExportAndImportBtn from '@features/fa-admin-pages/components/utils/ExportAndImportBtn';
import type { FaGridLayoutSaveStatus } from '@features/fa-admin-pages/components/utils/FaGridLayoutUtils';
import { Alert, Button, Divider, Space } from 'antd';
import type { Layout } from 'react-grid-layout';
import FaCubeGrid, { type FaCubeGridProps } from './FaCubeGrid';

export interface FaWorkbenchConfigDrawerProps {
  open: boolean;
  onClose: () => void;
  filename: string;
  layout: Layout;
  allLayout: FaCubeGridProps['allLayout'];
  cubes: FaCubeGridProps['cubes'];
  selectedIds: string[];
  onLayoutChange: (layout: Layout) => void;
  onAdd: FaCubeGridProps['onAdd'];
  onRemove: FaCubeGridProps['onRemove'];
  saveStatus: FaGridLayoutSaveStatus;
  retryLayout: () => void;
  handleClearLayout: () => void;
  handleSaveCurAsDefault: () => void;
  handleClearAllUserConfig: () => void;
}

export default function FaWorkbenchConfigDrawer({
  open,
  onClose,
  filename,
  layout,
  allLayout,
  cubes,
  selectedIds,
  onLayoutChange,
  onAdd,
  onRemove,
  saveStatus,
  retryLayout,
  handleClearLayout,
  handleSaveCurAsDefault,
  handleClearAllUserConfig,
}: FaWorkbenchConfigDrawerProps) {
  return (
    <BaseDrawer open={open} title="添加组件" bodyStyle={{ padding: 0 }} onClose={onClose}>
      <Space direction="vertical" size="small" className="fa-p12">
        <Space wrap>
          <Button onClick={handleClearLayout} danger>
            清空当前布局
          </Button>
          <Button onClick={handleSaveCurAsDefault}>保存当前为默认</Button>
        </Space>
        <Divider orientation="left" plain style={{ margin: '4px 0' }}>
          高级操作
        </Divider>
        <Space wrap>
          <ExportAndImportBtn
            filename={filename}
            layout={FaUtils.tryFormatJson(JSON.stringify(layout))}
            allowedIds={Object.keys(cubes)}
            onUpload={onLayoutChange}
          />
          <Button onClick={handleClearAllUserConfig} danger>
            清空全部用户缓存
          </Button>
        </Space>
      </Space>
      <FaCubeGrid allLayout={allLayout} cubes={cubes} selectedIds={selectedIds} onAdd={onAdd} onRemove={onRemove} />
      <div className="fa-p12" aria-live="polite">
        {saveStatus === 'saving' && <Alert type="info" showIcon message="保存中..." />}
        {saveStatus === 'error' && (
          <Alert
            type="error"
            showIcon
            message="保存失败"
            description="当前布局未成功保存，请重试。"
            action={
              <Button size="small" type="link" onClick={retryLayout}>
                重试
              </Button>
            }
          />
        )}
        {saveStatus === 'saved' && <Alert type="success" showIcon message="已保存" />}
      </div>
    </BaseDrawer>
  );
}
