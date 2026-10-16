import { type FilePreviewResource, PageLoading } from '@fa/ui';
import { fileSaveApi } from '@features/fa-admin-pages/services';
import { Button, Empty } from 'antd';
import { useEffect, useState } from 'react';
import FaFileUrlView from './FaFileUrlView';

export interface FaFileViewProps {
  fileId: string;
  waterMark?: boolean;
}

export default function FaFileView({ fileId, waterMark = true }: FaFileViewProps) {
  const [resource, setResource] = useState<FilePreviewResource>();
  const [error, setError] = useState<string>();
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setResource(undefined);
    setError(undefined);
    if (!fileId?.trim()) {
      setError('未传入文件');
      return;
    }

    fileSaveApi.getPreviewResource(fileId, { signal: controller.signal, headers: { hideErrorMsg: '1' } })
      .then((data) => {
        if (active) setResource(data);
      })
      .catch(() => {
        if (active) setError('文件预览加载失败，请重新加载或重新登录');
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fileId, reload]);

  return (
    <div className="fa-full fa-flex-column">
      <div className="fa-flex-row fa-p8">
        <Button size="small" onClick={() => setReload((value) => value + 1)}>重新加载预览</Button>
      </div>
      <div className="fa-flex-1" style={{ minHeight: 0 }}>
        {error ? <Empty description={error} /> : resource ? (
          <FaFileUrlView key={resource.previewUrl} url={resource.previewUrl} filename={resource.filename} waterMark={waterMark} />
        ) : <PageLoading />}
      </div>
    </div>
  );
}
