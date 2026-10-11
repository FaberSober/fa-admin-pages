import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import officeRenderers from '@file-viewer/preset-office';
import FileViewer, { type FileViewerProps } from '@file-viewer/react';
import { useCallback, useContext, useMemo, useState } from 'react';

export interface FileViewerDocumentProps {
  filename: string;
  size?: number;
  type: string;
  url: string;
  watermark?: boolean;
}

export default function FileViewerDocument({ filename, size, type, url, watermark = true }: FileViewerDocumentProps) {
  const { user } = useContext(UserLayoutContext);
  const [loadError, setLoadError] = useState<Error>();
  const onStateChange = useCallback<NonNullable<FileViewerProps['onStateChange']>>((state) => {
    if (!state.error) return;
    const error = state.error instanceof Error ? state.error : new Error('文件查看器加载失败');
    console.error('[FileViewerDocument] 文件渲染失败', error);
    setLoadError(error);
  }, []);
  // Convert the viewer's async errors into render errors handled by FilePreview's boundary.
  const viewerProps = useMemo<FileViewerProps>(() => ({
    filename,
    onStateChange,
    options: {
      preset: officeRenderers,
      rendererMode: 'replace',
      toolbar: {
        items: { download: false },
        permissions: { download: false },
      },
      watermark: watermark
        ? {
            enabled: true,
            text: `${user.name}/${user.username}`,
          }
        : false,
    },
    size,
    type,
    url,
  }), [filename, size, type, url, watermark, user.name, user.username, onStateChange]);

  if (loadError) throw loadError;

  return (
    <div className="fa-full" style={{ minHeight: 0 }}>
      <FileViewer {...viewerProps} />
    </div>
  );
}
