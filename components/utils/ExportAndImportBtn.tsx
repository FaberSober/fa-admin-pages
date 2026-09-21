import { Button, message, Space, Upload } from 'antd';
import { saveAs } from 'file-saver';
import type { Layout, LayoutItem } from 'react-grid-layout';
import FaInputEditModal from '../modal/FaInputEditModal';

const GRID_COLS = 24;

export interface ExportAndImportBtnProps {
  filename: string;
  layout: string;
  allowedIds: string[];
  onUpload: (layout: Layout) => void;
}

function parseLayout(value: string, allowedIds: string[]): Layout | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    message.error('配置 JSON 格式无效');
    return undefined;
  }

  if (!Array.isArray(parsed)) {
    message.error('配置必须是布局数组');
    return undefined;
  }

  const registeredIds = new Set(allowedIds);
  const layout: LayoutItem[] = [];
  const layoutIds = new Set<string>();

  for (const rawItem of parsed) {
    if (rawItem === null || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      message.error('布局项格式无效');
      return undefined;
    }

    const item = rawItem as Record<string, unknown>;
    const { i, x, y, w, h } = item;
    if (typeof i !== 'string' || !registeredIds.has(i)) {
      message.error(`配置包含未注册的组件：${String(i)}`);
      return undefined;
    }
    if (layoutIds.has(i)) {
      message.error(`配置包含重复的组件：${i}`);
      return undefined;
    }
    if (
      typeof x !== 'number' || !Number.isInteger(x) ||
      typeof y !== 'number' || !Number.isInteger(y) ||
      typeof w !== 'number' || !Number.isInteger(w) ||
      typeof h !== 'number' || !Number.isInteger(h) ||
      x < 0 || y < 0 || w <= 0 || h <= 0
    ) {
      message.error(`组件 ${i} 的位置或尺寸无效`);
      return undefined;
    }
    if (x + w > GRID_COLS) {
      message.error(`组件 ${i} 超出 ${GRID_COLS} 列网格范围`);
      return undefined;
    }

    layoutIds.add(i);
    layout.push(item as unknown as LayoutItem);
  }

  return layout;
}

/**
 * @author xu.pengfei
 * @date 2023/10/12 15:24
 */
export default function ExportAndImportBtn({ filename, layout, allowedIds, onUpload }: ExportAndImportBtnProps) {
  function handleUpload(value: string) {
    const parsedLayout = parseLayout(value, allowedIds);
    if (parsedLayout) {
      onUpload(parsedLayout);
    }
  }

  function handleSaveFile() {
    const blob = new Blob([layout], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.json`);
  }

  return (
    <Space>
      <FaInputEditModal title="编辑配置" value={layout} onChange={handleUpload}>
        <Button>编辑配置</Button>
      </FaInputEditModal>
      <Button onClick={handleSaveFile}>导出配置</Button>
      <Upload
        beforeUpload={(file) => {
          const reader = new FileReader();
          reader.readAsText(file);
          reader.onload = () => {
            handleUpload(typeof reader.result === 'string' ? reader.result : '');
          };
          reader.onerror = () => message.error('配置文件读取失败');
          return false;
        }}
        showUploadList={false}
      >
        <Button>上传配置</Button>
      </Upload>
    </Space>
  );
}
