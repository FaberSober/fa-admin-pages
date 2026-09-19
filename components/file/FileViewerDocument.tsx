import UserLayoutContext from '@features/fa-admin-pages/layout/user/context/UserLayoutContext';
import officeRenderers from '@file-viewer/preset-office';
import FileViewer, { type FileViewerProps } from '@file-viewer/react';
import { useContext } from 'react';

export interface FileViewerDocumentProps {
  filename: string;
  size?: number;
  type: string;
  url: string;
  watermark?: boolean;
}

export default function FileViewerDocument({ filename, size, type, url, watermark = true }: FileViewerDocumentProps) {
  const { user } = useContext(UserLayoutContext);
  const viewerProps: FileViewerProps = {
    filename,
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
  };

  return (
    <div className="fa-full" style={{ minHeight: 0 }}>
      <FileViewer {...viewerProps} />
    </div>
  );
}
