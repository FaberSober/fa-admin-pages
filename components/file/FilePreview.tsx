import { DownloadOutlined } from '@ant-design/icons';
import { FaUtils, PageLoading } from '@fa/ui';
import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import { fileSaveApi } from '@features/fa-admin-pages/services';
import type { Admin } from '@features/fa-admin-pages/types';
import { Button, Empty, Image } from 'antd';
import { Component, type CSSProperties, lazy, type ReactNode, Suspense, useContext, useEffect, useState } from 'react';
import FaFileUrlView from './FaFileUrlView';

const ReactPdfView = lazy(() => import('../pdf/ReactPdfView'));
const FileViewerDocument = lazy(() => import('./FileViewerDocument'));
const OnlyofficeEditor = lazy(() => import('../helper/OnlyofficeEditor'));

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'ico', 'bmp', 'gif', 'svg', 'webp']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'ogg']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'flac', 'aac', 'm4a']);
const FILE_VIEWER_EXTENSIONS = new Set(['docx', 'xlsx', 'pptx', 'ofd', 'pdf']);
const OFFICE_EDIT_EXTENSIONS = new Set(['docx', 'xlsx', 'pptx']);
const TEXT_EXTENSIONS = new Set([
  'txt',
  'log',
  'csv',
  'json',
  'xml',
  'md',
  'yaml',
  'yml',
  'sql',
  'js',
  'jsx',
  'ts',
  'tsx',
  'java',
  'kt',
  'go',
  'py',
  'rb',
  'php',
  'html',
  'css',
  'scss',
  'less',
  'sh',
  'bat',
  'conf',
  'properties',
]);

const MAX_TEXT_FILE_SIZE = 5 * 1024 * 1024;

type FilePreviewKind = 'image' | 'video' | 'audio' | 'text' | 'fileViewer' | 'fallback';

interface FilePreviewResource {
  file: Admin.FileSave;
  kind: FilePreviewKind;
  ext: string;
  fileUrl: string;
  previewUrl: string;
  absoluteFileUrl: string;
}

export interface FilePreviewProps {
  fileId: string;
  mode?: 'view' | 'edit';
  watermark?: boolean;
  download?: boolean;
  className?: string;
  style?: CSSProperties;
}

function isPermissionError(error: unknown) {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status === 401 || status === 403;
}

function normalizeExtension(file: Admin.FileSave) {
  const ext = file.ext || FaUtils.getExtension(file.originalFilename);
  return ext.replace(/^\./, '').toLowerCase();
}

function resolveKind(file: Admin.FileSave, ext: string): FilePreviewKind {
  const contentType = file.contentType?.toLowerCase() || '';

  if (IMAGE_EXTENSIONS.has(ext) || contentType.startsWith('image/')) return 'image';
  if (VIDEO_EXTENSIONS.has(ext) || contentType.startsWith('video/')) return 'video';
  if (AUDIO_EXTENSIONS.has(ext) || contentType.startsWith('audio/')) return 'audio';
  if (FILE_VIEWER_EXTENSIONS.has(ext) || contentType.startsWith('application/pdf')) return 'fileViewer';
  if (TEXT_EXTENSIONS.has(ext) || contentType.startsWith('text/') || contentType.includes('json')) return 'text';
  return 'fallback';
}

function resolveResource(file: Admin.FileSave): FilePreviewResource {
  const ext = normalizeExtension(file);
  const fileUrl = fileSaveApi.genLocalGetFile(file.id);

  return {
    file,
    ext,
    kind: resolveKind(file, ext),
    fileUrl,
    previewUrl: fileSaveApi.genLocalGetFilePreview(file.id),
    absoluteFileUrl: new URL(fileUrl, window.location.origin).toString(),
  };
}

function NativeViewer({ resource }: { resource: FilePreviewResource }) {
  const { file, fileUrl, previewUrl, kind } = resource;
  const mediaType = file.contentType?.includes('/') ? file.contentType : undefined;

  if (kind === 'image') {
    return (
      <div className="fa-full fa-flex-row fa-flex-row-center" style={{ overflow: 'auto' }}>
        <Image
          src={previewUrl || fileUrl}
          alt={file.originalFilename}
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          preview={{ src: fileUrl }}
        />
      </div>
    );
  }

  if (kind === 'video') {
    return (
      <div className="fa-full fa-flex-row fa-flex-row-center" style={{ overflow: 'hidden' }}>
        <video controls style={{ maxWidth: '100%', maxHeight: '100%' }}>
          <source src={fileUrl} type={mediaType} />
          当前浏览器不支持视频播放
        </video>
      </div>
    );
  }

  return (
    <div className="fa-full fa-flex-row fa-flex-row-center" style={{ overflow: 'hidden' }}>
      <audio controls>
        <source src={fileUrl} type={mediaType} />
        当前浏览器不支持音频播放
      </audio>
    </div>
  );
}

function PreviewWatermark() {
  const { user } = useContext(UserLayoutContext);
  const text = `${user.name}/${user.username}`;

  return (
    <div
      aria-hidden="true"
      style={{
        bottom: 0,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        left: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        position: 'absolute',
        right: 0,
        top: 0,
        userSelect: 'none',
        zIndex: 1,
      }}
    >
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          style={{
            alignSelf: 'center',
            color: 'rgba(0, 0, 0, 0.16)',
            fontSize: 14,
            justifySelf: 'center',
            transform: 'rotate(-28deg)',
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

function PreviewSurface({
  children,
  download,
  resource,
  watermark,
}: {
  children: ReactNode;
  download: boolean;
  resource: FilePreviewResource;
  watermark: boolean;
}) {
  const showClientWatermark = watermark && resource.kind !== 'fileViewer' && resource.kind !== 'fallback';

  return (
    <div className="fa-full fa-flex-column" style={{ minHeight: 0 }}>
      {download && (
        <div className="fa-flex-row fa-flex-row-end" style={{ flex: '0 0 auto', padding: '0 8px' }}>
          <Button
            aria-label={`下载 ${resource.file.originalFilename}`}
            icon={<DownloadOutlined />}
            size="small"
            type="link"
            onClick={() => fileSaveApi.openFile(resource.file.id)}
          >
            下载
          </Button>
        </div>
      )}
      <div className="fa-flex-1" style={{ minHeight: 0, position: 'relative' }}>
        {children}
        {showClientWatermark && <PreviewWatermark />}
      </div>
    </div>
  );
}

function TextViewer({ resource }: { resource: FilePreviewResource }) {
  const [content, setContent] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setContent(undefined);
    setError(undefined);
    setLoading(true);

    if (Number(resource.file.size) > MAX_TEXT_FILE_SIZE) {
      setLoading(false);
      setError('文本文件过大或读取失败');
      return () => {
        active = false;
      };
    }

    fileSaveApi
      .getFileStr(resource.file.id, { signal: controller.signal, headers: { hideErrorMsg: '1' } })
      .then((res) => {
        if (!active) return;
        setContent(res.data || '');
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(isPermissionError(requestError) ? '无权查看该文件' : '文本文件过大或读取失败');
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [resource.file.id, resource.file.size]);

  if (loading) return <PageLoading />;
  if (error) return <Empty description={error} />;

  return (
    <pre
      className="fa-full"
      style={{
        boxSizing: 'border-box',
        margin: 0,
        overflow: 'auto',
        padding: 16,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {content}
    </pre>
  );
}

interface FileViewerErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface FileViewerErrorBoundaryState {
  hasError: boolean;
}

class FileViewerErrorBoundary extends Component<FileViewerErrorBoundaryProps, FileViewerErrorBoundaryState> {
  state: FileViewerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): FileViewerErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function FileViewerFallback({ resource, watermark }: { resource: FilePreviewResource; watermark: boolean }) {
  if (resource.ext === 'pdf') {
    return (
      <div className="fa-full" style={{ minHeight: 0, position: 'relative' }}>
        <Suspense fallback={<PageLoading />}>
          <ReactPdfView fileUrl={resource.fileUrl} />
        </Suspense>
        {watermark && <PreviewWatermark />}
      </div>
    );
  }

  return <FaFileUrlView url={resource.absoluteFileUrl} filename={resource.file.originalFilename} waterMark={watermark} />;
}

function FileViewerViewer({ resource, watermark }: { resource: FilePreviewResource; watermark: boolean }) {
  return (
    <FileViewerErrorBoundary key={resource.file.id} fallback={<FileViewerFallback resource={resource} watermark={watermark} />}>
      <Suspense fallback={<PageLoading />}>
        <FileViewerDocument
          url={resource.absoluteFileUrl}
          filename={resource.file.originalFilename}
          type={resource.ext}
          size={Number(resource.file.size) || undefined}
          watermark={watermark}
        />
      </Suspense>
    </FileViewerErrorBoundary>
  );
}

function OfficeEditor({ fileId }: { fileId: string }) {
  return (
    <Suspense fallback={<PageLoading />}>
      <OnlyofficeEditor key={fileId} fileId={fileId} mode="edit" />
    </Suspense>
  );
}

function FilePreviewContent({ resource, watermark, download }: { resource: FilePreviewResource; watermark: boolean; download: boolean }) {
  let content: ReactNode;

  if (resource.kind === 'image' || resource.kind === 'video' || resource.kind === 'audio') {
    content = <NativeViewer resource={resource} />;
  } else if (resource.kind === 'text') {
    content = <TextViewer resource={resource} />;
  } else if (resource.kind === 'fileViewer') {
    content = <FileViewerViewer resource={resource} watermark={watermark} />;
  } else {
    content = <FaFileUrlView url={resource.absoluteFileUrl} filename={resource.file.originalFilename} waterMark={watermark} />;
  }

  return (
    <PreviewSurface download={download} resource={resource} watermark={watermark}>
      {content}
    </PreviewSurface>
  );
}

export default function FilePreview({ fileId, mode = 'view', watermark = true, download = true, className = 'fa-full', style }: FilePreviewProps) {
  const [resource, setResource] = useState<FilePreviewResource>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setResource(undefined);
    setError(undefined);
    setLoading(true);

    if (!fileId?.trim()) {
      setError('未传入文件');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    fileSaveApi
      .getById(fileId, { signal: controller.signal, headers: { hideErrorMsg: '1' } })
      .then((res) => {
        if (!active) return;
        if (!res.data) {
          setError('文件未找到');
        } else {
          setResource(resolveResource(res.data));
        }
        setLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(isPermissionError(requestError) ? '无权查看该文件' : '文件加载失败');
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fileId]);

  if (loading)
    return (
      <div className={className} style={style}>
        <PageLoading />
      </div>
    );
  if (error)
    return (
      <div className={className} style={style}>
        <Empty description={error} />
      </div>
    );
  if (!resource)
    return (
      <div className={className} style={style}>
        <Empty description="文件未找到" />
      </div>
    );
  if (mode === 'edit' && resource.kind === 'fileViewer' && OFFICE_EDIT_EXTENSIONS.has(resource.ext))
    return (
      <div className={className} style={style}>
        <OfficeEditor fileId={resource.file.id} />
      </div>
    );
  if (mode === 'edit')
    return (
      <div className={className} style={style}>
        <Empty description="当前版本暂不支持在线编辑" />
      </div>
    );

  return (
    <div className={className} style={style}>
      <FilePreviewContent download={download} resource={resource} watermark={watermark} />
    </div>
  );
}
