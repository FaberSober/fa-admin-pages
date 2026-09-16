import officeRenderers from '@file-viewer/preset-office';
import FileViewer, { type FileViewerProps } from '@file-viewer/react';

export interface FileViewerDocumentProps {
  filename: string;
  size?: number;
  type: string;
  url: string;
}

export default function FileViewerDocument({ filename, size, type, url }: FileViewerDocumentProps) {
  const viewerProps: FileViewerProps = {
    filename,
    options: {
      preset: officeRenderers,
      rendererMode: 'replace',
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
