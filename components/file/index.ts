import { lazy } from 'react';

// 保持文档渲染器按需加载，避免聚合入口提前加载 Office/PDF 依赖。
export const FileViewerDocument = lazy(() => import('./FileViewerDocument'));

export { default as FaFileUrlView } from './FaFileUrlView';
export { default as FaFileView } from './FaFileView';
export { default as FaFileViewModal } from './FaFileViewModal';
export { default as FileBizList } from './FileBizList';
export { default as FileBizListDrawer } from './FileBizListDrawer';
export { default as FileBizListView } from './FileBizListView';
export { default as FileImgView } from './FileImgView';
export { default as FilePreview } from './FilePreview';
export { default as FilePreviewModal } from './FilePreviewModal';
export { default as FilePreviewPage } from './FilePreviewPage';
export { default as FileSaveIcon } from './FileSaveIcon';
