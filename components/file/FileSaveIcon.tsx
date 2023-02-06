import React, { CSSProperties } from 'react';
import { Image } from 'antd';
import { Admin } from '@/types';
import { FaUtils } from '@fa/ui';
import { fileSaveApi } from '@/services';

export interface FileSaveIconProps {
  file: Admin.FileSave;
  width: number;
  style?: CSSProperties;
}

/**
 * @author xu.pengfei
 * @date 2022/12/29 13:58
 */
export default function FileSaveIcon({ file, width = 20, style }: FileSaveIconProps) {
  const divStyle = {
    height: width,
    ...style,
  };

  const isImg = FaUtils.isImg(file.ext);
  if (isImg) {
    return (
      <div className="fa-flex-row fa-flex-row-center" style={divStyle}>
        <Image
          width={width}
          src={fileSaveApi.genLocalGetFilePreview(file.id)}
          preview={{
            src: fileSaveApi.genLocalGetFile(file.id),
          }}
        />
        <span>{file.originalFilename}</span>
        {/*<img src={fileSaveApi.genLocalGetFilePreview(file.id)} style={{ maxWidth: width, maxHeight: width }} alt={file.originalFilename} />*/}
      </div>
    );
  }

  return (
    <a href={fileSaveApi.genLocalGetFile(file.id)} target="_blank">{file.originalFilename}</a>
  );
}
