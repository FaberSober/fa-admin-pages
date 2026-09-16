import { type CSSProperties, type ReactNode } from 'react';
import FilePreview, { type FilePreviewProps } from './FilePreview';

export interface FilePreviewPageProps extends Omit<FilePreviewProps, 'className' | 'style'> {
  title?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function FilePreviewPage({ title, className, style, ...previewProps }: FilePreviewPageProps) {
  return (
    <div className={`fa-full-content fa-flex-column${className ? ` ${className}` : ''}`} style={{ overflow: 'hidden', ...style }}>
      {title && (
        <div className="fa-p12 fa-border-b" style={{ flex: '0 0 auto' }}>
          {title}
        </div>
      )}
      <div className="fa-flex-1" style={{ minHeight: 0, minWidth: 0 }}>
        <FilePreview {...previewProps} />
      </div>
    </div>
  );
}
