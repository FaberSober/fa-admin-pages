import React, { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { fileSaveApi } from '@features/fa-admin-pages/services';
import { DEFAULT_SYSTEM_LOGO_URL } from '@features/fa-admin-pages/constants/staticAssets';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & {
  fileId?: string | null;
};

export default function SystemLogo({ fileId, ...imgProps }: Props) {
  const normalizedFileId = fileId?.trim();
  const configuredUrl = normalizedFileId ? fileSaveApi.genLocalGetFile(normalizedFileId) : '';
  const preferredUrl = configuredUrl || DEFAULT_SYSTEM_LOGO_URL;
  const [src, setSrc] = useState(preferredUrl);

  useEffect(() => {
    setSrc(preferredUrl);
  }, [preferredUrl]);

  return (
    <img
      {...imgProps}
      src={src}
      onError={() => {
        if (src !== DEFAULT_SYSTEM_LOGO_URL) setSrc(DEFAULT_SYSTEM_LOGO_URL);
      }}
    />
  );
}
