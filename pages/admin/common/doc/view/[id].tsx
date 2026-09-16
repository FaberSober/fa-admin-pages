import { FilePreviewPage } from '@features/fa-admin-pages/components';
import React from 'react';
import { useParams } from 'react-router-dom';

/**
 * 在线查看office文档
 * @author xu.pengfei
 * @date 2023/3/14 15:52
 */
export default function DocView() {
  const { id } = useParams();

  return <FilePreviewPage fileId={id ?? ''} />;
}
